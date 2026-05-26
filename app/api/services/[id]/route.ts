import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

async function getOwn(userId: string, id: string) {
  const s = await db.service.findFirst({ where: { id, userId } });
  if (!s) throw new ApiError(404, "Serviço não encontrado.");
  return s;
}

export const GET = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  return ok({ service: await getOwn(session.userId, id) });
});

export const PUT = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwn(session.userId, id);
  const data = ServiceSchema.parse(await req.json());
  const slugTaken = await db.service.findFirst({
    where: { userId: session.userId, slug: data.slug, id: { not: id } },
  });
  if (slugTaken) throw new ApiError(409, "Slug já em uso.");
  const service = await db.service.update({
    where: { id },
    data: {
      name: data.name, description: data.description ?? null, slug: data.slug,
      color: data.color, isActive: data.isActive, isPublic: data.isPublic,
      durationInMinutes: data.durationInMinutes,
      bufferTimeBefore: data.bufferTimeBefore, bufferTimeAfter: data.bufferTimeAfter,
      price: data.price, currency: data.currency, paymentRequired: data.paymentRequired,
      isVideoCall: data.isVideoCall, videoCallProvider: data.videoCallProvider ?? null,
      customMeetingUrl: data.customMeetingUrl ?? null,
      maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? null,
      minimumNoticeMinutes: data.minimumNoticeMinutes ?? null,
      maxParticipants: data.maxParticipants, position: data.position,
    },
  });
  return ok({ service });
});

export const DELETE = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwn(session.userId, id);
  await db.service.delete({ where: { id } });
  return ok({ ok: true });
});