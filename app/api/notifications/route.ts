import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/notifications?bookingId=xxx&status=PENDING&limit=50
export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  const status = searchParams.get("status");
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));

  // Garante que só acessa notificações dos próprios agendamentos
  let sql = `
    SELECT nl.*
    FROM notification_logs nl
    JOIN bookings b ON b.id = nl.booking_id
    WHERE b.user_id = ?
  `;
  const args: (string | number)[] = [session.userId];

  if (bookingId) { sql += " AND nl.booking_id = ?"; args.push(bookingId); }
  if (status)    { sql += " AND nl.status = ?";     args.push(status); }

  sql += " ORDER BY nl.created_at DESC LIMIT ?";
  args.push(limit);

  const result = await db.execute({ sql, args });
  return ok({ notifications: result.rows });
});
