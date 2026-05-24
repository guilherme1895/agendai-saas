import { apiHandler, ok, created } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerSchema } from "@/lib/validators";
import { generateCuid } from "@/lib/utils";

// GET /api/customers?q=search&page=1&limit=20
export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const offset = (page - 1) * limit;

  const search = `%${q}%`;
  const result = await db.execute({
    sql: `SELECT * FROM customers
          WHERE user_id = ?
            AND (? = '%%' OR name LIKE ? OR email LIKE ? OR phone LIKE ?)
          ORDER BY last_booking_at DESC, name ASC
          LIMIT ? OFFSET ?`,
    args: [session.userId, search, search, search, search, limit, offset],
  });

  const countRes = await db.execute({
    sql: `SELECT COUNT(*) as total FROM customers
          WHERE user_id = ? AND (? = '%%' OR name LIKE ? OR email LIKE ?)`,
    args: [session.userId, search, search, search],
  });

  return ok({
    customers: result.rows,
    pagination: {
      page, limit,
      total: Number(countRes.rows[0].total),
      pages: Math.ceil(Number(countRes.rows[0].total) / limit),
    },
  });
});

// POST /api/customers
export const POST = apiHandler(async (req) => {
  const session = await requireSession();
  const data = CustomerSchema.parse(await req.json());

  const existing = await db.execute({
    sql: "SELECT id FROM customers WHERE user_id = ? AND email = ?",
    args: [session.userId, data.email],
  });
  if (existing.rows.length > 0) {
    throw new ApiError(409, "Cliente com este e-mail já cadastrado.");
  }

  const id = generateCuid();
  await db.execute({
    sql: `INSERT INTO customers (id, user_id, name, email, phone, notes, tags, source)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, session.userId, data.name, data.email,
      data.phone ?? null, data.notes ?? null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.source ?? null,
    ],
  });

  const customer = await db.execute({ sql: "SELECT * FROM customers WHERE id = ?", args: [id] });
  return created({ customer: customer.rows[0] });
});
