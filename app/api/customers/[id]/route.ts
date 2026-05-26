import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

async function getOwn(userId: string, id: string) {
  const c = await db.customer.findFirst({ where: { id, userId } });
  if (!c) throw new ApiError(404, "Cliente não encontrado.");
  return c;
}

export const GET = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const customer = await getOwn(session.userId, id);
  const bookings = await db.booking.findMany({
    where: { customerId: id, userId: session.userId },
    include: { service: { select: { name: true, color: true } } },
    orderBy: { startAt: "desc" },
    take: 20,
  });
  return ok({ customer, bookings });
});

export const PUT = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwn(session.userId, id);
  const data = CustomerSchema.parse(await req.json());
  const customer = await db.customer.update({
    where: { id },
    data: {
      name: data.name, email: data.email, phone: data.phone ?? null,
      notes: data.notes ?? null, tags: data.tags ?? [], source: data.source ?? null,
    },
  });
  return ok({ customer });
});

export const DELETE = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwn(session.userId, id);
  await db.customer.delete({ where: { id } });
  return ok({ ok: true });
});