import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingUpdateSchema } from "@/lib/validators";
import type { BookingRow } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnBooking(userId: string, id: string): Promise<BookingRow> {
  const r = await db.execute({
    sql: "SELECT * FROM bookings WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  if (!r.rows.length) throw new ApiError(404, "Agendamento não encontrado.");
  return r.rows[0] as unknown as BookingRow;
}

// GET /api/bookings/[id]
export const GET = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;

  const result = await db.execute({
    sql: `SELECT b.*,
                 s.name AS service_name, s.color AS service_color,
                 s.duration_in_minutes, s.is_video_call,
                 c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
          FROM bookings b
          JOIN services  s ON s.id = b.service_id
          JOIN customers c ON c.id = b.customer_id
          WHERE b.id = ? AND b.user_id = ?`,
    args: [id, session.userId],
  });
  if (!result.rows.length) throw new ApiError(404, "Agendamento não encontrado.");

  const notifs = await db.execute({
    sql: "SELECT * FROM notification_logs WHERE booking_id = ? ORDER BY created_at DESC",
    args: [id],
  });

  return ok({ booking: result.rows[0], notifications: notifs.rows });
});

// PATCH /api/bookings/[id] — atualiza status ou notas internas
export const PATCH = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const booking = await getOwnBooking(session.userId, id);
  const data = BookingUpdateSchema.parse(await req.json());

  const setClauses: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];

  if (data.status) { setClauses.push("status = ?"); args.push(data.status); }
  if (data.internalNotes !== undefined) { setClauses.push("internal_notes = ?"); args.push(data.internalNotes ?? null); }
  if (data.cancelReason !== undefined) { setClauses.push("cancel_reason = ?"); args.push(data.cancelReason ?? null); }

  args.push(id, session.userId);
  await db.execute({
    sql: `UPDATE bookings SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ?`,
    args,
  });

  const updated = await db.execute({ sql: "SELECT * FROM bookings WHERE id = ?", args: [id] });
  return ok({ booking: updated.rows[0] });
});
