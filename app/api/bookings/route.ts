import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/bookings?month=2024-01&status=confirmed&serviceId=xxx
export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");         // "YYYY-MM"
  const status = searchParams.get("status");       // BookingStatus
  const serviceId = searchParams.get("serviceId");
  const customerId = searchParams.get("customerId");

  let sql = `
    SELECT b.*,
           s.name  AS service_name,
           s.color AS service_color,
           s.duration_in_minutes,
           s.is_video_call,
           c.name  AS customer_name,
           c.email AS customer_email,
           c.phone AS customer_phone
    FROM bookings b
    JOIN services  s ON s.id = b.service_id
    JOIN customers c ON c.id = b.customer_id
    WHERE b.user_id = ?
  `;
  const args: (string | number)[] = [session.userId];

  if (month) { sql += " AND strftime('%Y-%m', b.start_at) = ?"; args.push(month); }
  if (status) { sql += " AND b.status = ?"; args.push(status); }
  if (serviceId) { sql += " AND b.service_id = ?"; args.push(serviceId); }
  if (customerId) { sql += " AND b.customer_id = ?"; args.push(customerId); }

  sql += " ORDER BY b.start_at ASC";

  const result = await db.execute({ sql, args });
  return ok({ bookings: result.rows });
});
