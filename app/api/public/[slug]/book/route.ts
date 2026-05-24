import { apiHandler, ok, created } from "@/lib/api";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { PublicBookingSchema } from "@/lib/validators";
import { getFreeSlotsForDate } from "@/lib/slots";
import { scheduleBookingNotifications } from "@/lib/notifications";
import { createCalendarEvent } from "@/lib/google-calendar";
import { createPaymentIntent } from "@/lib/stripe";
import { generateCuid } from "@/lib/utils";
import type { UserRow, ServiceRow, CustomerRow, BookingRow } from "@/lib/types";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * POST /api/public/[slug]/book
 * O fluxo completo:
 *   1. Valida inputs (Zod)
 *   2. Confirma que o slot ainda está livre
 *   3. Upsert Customer (mini-CRM)
 *   4. Cria Booking
 *   5. Cria evento no Google Calendar (se integrado)
 *   6. Se pago: cria PaymentIntent e retorna clientSecret
 *   7. Enfileira notificações
 */
export const POST = apiHandler(async (req, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const data = PublicBookingSchema.parse(await req.json());

  // --- 1. Busca provider ---
  const userRes = await db.execute({
    sql: "SELECT * FROM users WHERE slug = ?",
    args: [slug],
  });
  if (!userRes.rows.length) throw new ApiError(404, "Prestador não encontrado.");
  const user = userRes.rows[0] as unknown as UserRow;

  // --- 2. Busca serviço ---
  const svcRes = await db.execute({
    sql: "SELECT * FROM services WHERE id = ? AND user_id = ? AND is_active = 1 AND is_public = 1",
    args: [data.serviceId, user.id],
  });
  if (!svcRes.rows.length) throw new ApiError(404, "Serviço não disponível.");
  const service = svcRes.rows[0] as unknown as ServiceRow;

  // --- 3. Valida que o slot ainda está livre ---
  const freeSlots = await getFreeSlotsForDate(user, service, data.date);
  const slotOk = freeSlots.some((s) => s.startTime === data.startTime);
  if (!slotOk) {
    throw new ApiError(409, "Este horário não está mais disponível. Por favor, escolha outro.");
  }

  // --- 4. Monta os datetimes (assumindo timezone do prestador para simplicidade SQLite) ---
  const startAt = `${data.date}T${data.startTime}:00`;
  const endMinutes =
    data.startTime.split(":").reduce((h, m, i) => h + (i === 0 ? Number(m) * 60 : Number(m)), 0) +
    service.duration_in_minutes;
  const endHH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
  const endMM = String(endMinutes % 60).padStart(2, "0");
  const endAt = `${data.date}T${endHH}:${endMM}:00`;

  // --- 5. Upsert Customer ---
  const existingCustomer = await db.execute({
    sql: "SELECT * FROM customers WHERE user_id = ? AND email = ?",
    args: [user.id, data.customerEmail],
  });

  let customerId: string;
  if (existingCustomer.rows.length > 0) {
    const existing = existingCustomer.rows[0] as unknown as CustomerRow;
    customerId = existing.id;
    // Atualiza nome/phone se mudou
    await db.execute({
      sql: "UPDATE customers SET name=?, phone=?, updated_at=datetime('now') WHERE id=?",
      args: [data.customerName, data.customerPhone ?? existing.phone, customerId],
    });
  } else {
    customerId = generateCuid();
    await db.execute({
      sql: `INSERT INTO customers (id, user_id, name, email, phone, source)
            VALUES (?, ?, ?, ?, ?, 'booking_page')`,
      args: [customerId, user.id, data.customerName, data.customerEmail, data.customerPhone ?? null],
    });
  }

  // --- 6. Cria Booking ---
  const bookingId = generateCuid();
  const manageToken = generateCuid();

  await db.execute({
    sql: `INSERT INTO bookings (
            id, user_id, service_id, customer_id,
            start_at, end_at, customer_timezone,
            status, payment_status, customer_notes, manage_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      bookingId, user.id, service.id, customerId,
      startAt, endAt, data.customerTimezone,
      service.payment_required ? "pending_payment" : "confirmed",
      service.payment_required ? "unpaid" : "unpaid",
      data.customerNotes ?? null,
      manageToken,
    ],
  });

  // --- 7. Google Calendar ---
  let meetingUrl: string | null = null;
  if (service.is_video_call && service.video_call_provider === "google_meet") {
    const account = await db.execute({
      sql: "SELECT * FROM accounts WHERE user_id = ? AND provider = 'google' AND google_calendar_enabled = 1",
      args: [user.id],
    });
    if (account.rows.length > 0) {
      const acc = account.rows[0] as Record<string, unknown>;
      try {
        const event = await createCalendarEvent({
          accessToken: acc.access_token as string,
          refreshToken: acc.refresh_token as string,
          expiresAt: acc.expires_at as number | null,
          calendarId: (acc.google_calendar_id as string) ?? "primary",
          title: `${service.name} — ${data.customerName}`,
          description: `Agendamento via AgendaAí\nCliente: ${data.customerName} (${data.customerEmail})${data.customerNotes ? `\nObs: ${data.customerNotes}` : ""}`,
          startAt,
          endAt,
          timezone: user.timezone,
          attendeeEmail: data.customerEmail,
          attendeeName: data.customerName,
          createMeetLink: true,
        });
        meetingUrl = event.meetLink ?? null;
        await db.execute({
          sql: "UPDATE bookings SET google_calendar_event_id=?, meeting_url=? WHERE id=?",
          args: [event.id, meetingUrl, bookingId],
        });
      } catch (e) {
        console.error("Google Calendar error (non-fatal):", e);
      }
    }
  }

  // URL de videoconferência customizada (Zoom pessoal, etc.)
  if (!meetingUrl && service.custom_meeting_url) {
    meetingUrl = service.custom_meeting_url;
    await db.execute({
      sql: "UPDATE bookings SET meeting_url=? WHERE id=?",
      args: [meetingUrl, bookingId],
    });
  }

  // --- 8. Stripe PaymentIntent (se serviço pago) ---
  let stripeClientSecret: string | null = null;
  if (service.payment_required && service.price > 0 && user.stripe_account_id) {
    try {
      const pi = await createPaymentIntent({
        amountCents: service.price,
        currency: service.currency,
        providerStripeAccountId: user.stripe_account_id,
        bookingId,
        customerEmail: data.customerEmail,
        serviceName: service.name,
      });
      stripeClientSecret = pi.clientSecret;
      await db.execute({
        sql: "UPDATE bookings SET stripe_payment_intent_id=? WHERE id=?",
        args: [pi.paymentIntentId, bookingId],
      });
    } catch (e) {
      console.error("Stripe error (non-fatal):", e);
    }
  }

  // --- 9. Enfileira notificações ---
  const customerRow = await db.execute({
    sql: "SELECT * FROM customers WHERE id = ?",
    args: [customerId],
  });
  const booking = await db.execute({
    sql: "SELECT * FROM bookings WHERE id = ?",
    args: [bookingId],
  });

  await scheduleBookingNotifications(
    booking.rows[0] as unknown as BookingRow,
    customerRow.rows[0] as unknown as CustomerRow,
    service,
    user,
  );

  // --- 10. Atualiza stats do customer ---
  await db.execute({
    sql: `UPDATE customers SET
            total_bookings = total_bookings + 1,
            last_booking_at = datetime('now'),
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [customerId],
  });

  return created({
    bookingId,
    manageToken,
    status: service.payment_required ? "pending_payment" : "confirmed",
    meetingUrl,
    startAt,
    endAt,
    ...(stripeClientSecret ? { stripeClientSecret } : {}),
  });
});
