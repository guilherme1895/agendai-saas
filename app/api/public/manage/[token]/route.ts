import { apiHandler, ok } from "@/lib/api";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CancelBookingSchema } from "@/lib/validators";
import { scheduleCancellationNotification } from "@/lib/notifications";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import type { BookingRow, CustomerRow, ServiceRow } from "@/lib/types";

type Ctx = { params: Promise<{ token: string }> };

// GET /api/public/manage/[token] — cliente consulta seu agendamento sem login
export const GET = apiHandler(async (_, ctx: Ctx) => {
  const { token } = await ctx.params;

  const result = await db.execute({
    sql: `SELECT b.*,
                 s.name AS service_name, s.duration_in_minutes,
                 s.is_video_call, s.color AS service_color,
                 c.name AS customer_name, c.email AS customer_email,
                 u.name AS provider_name, u.timezone AS provider_timezone
          FROM bookings b
          JOIN services  s ON s.id = b.service_id
          JOIN customers c ON c.id = b.customer_id
          JOIN users     u ON u.id = b.user_id
          WHERE b.manage_token = ?`,
    args: [token],
  });

  if (!result.rows.length) throw new ApiError(404, "Agendamento não encontrado.");
  return ok({ booking: result.rows[0] });
});

// POST /api/public/manage/[token]/cancel — cliente cancela sem login
export const POST = apiHandler(async (req, ctx: Ctx) => {
  const { token } = await ctx.params;
  const data = CancelBookingSchema.parse(await req.json());

  const bResult = await db.execute({
    sql: "SELECT * FROM bookings WHERE manage_token = ?",
    args: [token],
  });
  if (!bResult.rows.length) throw new ApiError(404, "Agendamento não encontrado.");
  const booking = bResult.rows[0] as unknown as BookingRow;

  if (booking.status.startsWith("cancelled")) {
    throw new ApiError(400, "Agendamento já está cancelado.");
  }

  // Verifica se ainda está dentro da janela de cancelamento (antes de começar)
  const startAt = new Date(booking.start_at);
  if (startAt <= new Date()) {
    throw new ApiError(400, "Não é possível cancelar um agendamento que já começou.");
  }

  await db.execute({
    sql: `UPDATE bookings SET
            status = 'cancelled_by_customer',
            cancelled_at = datetime('now'),
            cancel_reason = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [data.reason ?? null, booking.id],
  });

  // Remove do Google Calendar
  if (booking.google_calendar_event_id) {
    const account = await db.execute({
      sql: "SELECT * FROM accounts WHERE user_id = ? AND provider = 'google'",
      args: [booking.user_id],
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
          console.error("GCal delete failed (non-fatal):", e);
        }
      }
    }
  }

  // Notificação de cancelamento
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

  return ok({ ok: true, status: "cancelled_by_customer" });
});
