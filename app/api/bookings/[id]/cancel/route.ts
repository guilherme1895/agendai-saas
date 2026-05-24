import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CancelBookingSchema } from "@/lib/validators";
import { scheduleCancellationNotification } from "@/lib/notifications";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { refundPayment } from "@/lib/stripe";
import type { BookingRow, CustomerRow, ServiceRow } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/bookings/[id]/cancel
export const POST = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const data = CancelBookingSchema.parse(await req.json());

  // Busca agendamento
  const bResult = await db.execute({
    sql: "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
    args: [id, session.userId],
  });
  if (!bResult.rows.length) throw new ApiError(404, "Agendamento não encontrado.");
  const booking = bResult.rows[0] as unknown as BookingRow;

  if (booking.status.startsWith("cancelled")) {
    throw new ApiError(400, "Agendamento já está cancelado.");
  }

  const newStatus = data.cancelledBy === "provider"
    ? "cancelled_by_provider"
    : "cancelled_by_customer";

  // Atualiza status
  await db.execute({
    sql: `UPDATE bookings SET
            status = ?, cancelled_at = datetime('now'), cancel_reason = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [newStatus, data.reason ?? null, id],
  });

  // Reembolso Stripe (se solicitado e pago)
  if (data.refund && booking.stripe_charge_id && booking.paid_amount_cents > 0) {
    try {
      await refundPayment({ chargeId: booking.stripe_charge_id });
      await db.execute({
        sql: `UPDATE bookings SET
                payment_status='refunded',
                refunded_amount_cents=paid_amount_cents,
                refunded_at=datetime('now')
              WHERE id=?`,
        args: [id],
      });
    } catch (e) {
      console.error("Refund failed:", e);
    }
  }

  // Remove do Google Calendar
  if (booking.google_calendar_event_id) {
    const account = await db.execute({
      sql: "SELECT * FROM accounts WHERE user_id = ? AND provider = 'google'",
      args: [session.userId],
    });
    if (account.rows.length > 0) {
      const acc = account.rows[0] as Record<string, unknown>;
      if (acc.google_calendar_id && acc.access_token) {
        try {
          await deleteCalendarEvent({
            accessToken: acc.access_token as string,
            refreshToken: acc.refresh_token as string,
            expiresAt: acc.expires_at as number | null,
            calendarId: acc.google_calendar_id as string,
            eventId: booking.google_calendar_event_id,
          });
        } catch (e) {
          console.error("GCal delete failed:", e);
        }
      }
    }
  }

  // Enfileira e-mail de cancelamento
  const customer = await db.execute({
    sql: "SELECT * FROM customers WHERE id = ?",
    args: [booking.customer_id],
  });
  const service = await db.execute({
    sql: "SELECT * FROM services WHERE id = ?",
    args: [booking.service_id],
  });
  if (customer.rows.length && service.rows.length) {
    await scheduleCancellationNotification(
      booking,
      customer.rows[0] as unknown as CustomerRow,
      service.rows[0] as unknown as ServiceRow,
    );
  }

  return ok({ ok: true, status: newStatus });
});
