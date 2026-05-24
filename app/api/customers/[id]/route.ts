import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerSchema } from "@/lib/validators";
import type { CustomerRow } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnCustomer(userId: string, id: string): Promise<CustomerRow> {
  const r = await db.execute({
    sql: "SELECT * FROM customers WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  if (!r.rows.length) throw new ApiError(404, "Cliente não encontrado.");
  return r.rows[0] as unknown as CustomerRow;
}

export const GET = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const customer = await getOwnCustomer(session.userId, id);

  // Busca histórico de agendamentos
  const bookings = await db.execute({
    sql: `SELECT b.*, s.name as service_name, s.color as service_color
          FROM bookings b
          JOIN services s ON s.id = b.service_id
          WHERE b.customer_id = ? AND b.user_id = ?
          ORDER BY b.start_at DESC LIMIT 20`,
    args: [id, session.userId],
  });

  return ok({ customer, bookings: bookings.rows });
});

export const PUT = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwnCustomer(session.userId, id);
  const data = CustomerSchema.parse(await req.json());

  await db.execute({
    sql: `UPDATE customers SET
            name=?, email=?, phone=?, notes=?, tags=?, source=?,
            updated_at=datetime('now')
          WHERE id=? AND user_id=?`,
    args: [
      data.name, data.email, data.phone ?? null, data.notes ?? null,
      data.tags ? JSON.stringify(data.tags) : null, data.source ?? null,
      id, session.userId,
    ],
  });

  const updated = await db.execute({ sql: "SELECT * FROM customers WHERE id = ?", args: [id] });
  return ok({ customer: updated.rows[0] });
});

export const DELETE = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwnCustomer(session.userId, id);
  await db.execute({ sql: "DELETE FROM customers WHERE id = ? AND user_id = ?", args: [id, session.userId] });
  return ok({ ok: true });
});
