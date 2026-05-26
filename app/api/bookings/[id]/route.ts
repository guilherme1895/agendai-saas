import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingUpdateSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const booking = await db.booking.findFirst({
    where: { id, userId: session.userId },
    include: {
      service: true,
      customer: true,
      notificationLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) throw new ApiError(404, "Agendamento não encontrado.");
  return ok({ booking });
});

export const PATCH = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const existing = await db.booking.findFirst({ where: { id, userId: session.userId } });
  if (!existing) throw new ApiError(404, "Agendamento não encontrado.");
  const data = BookingUpdateSchema.parse(await req.json());
  const booking = await db.booking.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes ?? null } : {}),
      ...(data.cancelReason !== undefined ? { cancelReason: data.cancelReason ?? null } : {}),
    },
  });
  return ok({ booking });
});