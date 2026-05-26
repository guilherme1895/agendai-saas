import { apiHandler, ok, created } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomerSchema } from "@/lib/validators";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
  const skip = (page - 1) * limit;
  const where = {
    userId: session.userId,
    ...(q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };
  const [customers, total] = await Promise.all([    db.customer.findMany({ where, orderBy: { lastBookingAt: "desc" }, skip, take: limit }),    db.customer.count({ where }),  ]);
  return ok({ customers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const POST = apiHandler(async (req) => {
  const session = await requireSession();
  const data = CustomerSchema.parse(await req.json());
  const existing = await db.customer.findUnique({
    where: { userId_email: { userId: session.userId, email: data.email } },
  });
  if (existing) throw new ApiError(409, "Cliente com este e-mail já cadastrado.");
  const customer = await db.customer.create({
    data: {
      userId: session.userId,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      notes: data.notes ?? null,
      tags: data.tags ?? [],
      source: data.source ?? null,
    },
  });
  return created({ customer });
});