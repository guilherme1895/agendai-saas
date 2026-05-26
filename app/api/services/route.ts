import { apiHandler, ok, created } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceSchema } from "@/lib/validators";

export const GET = apiHandler(async () => {
  const session = await requireSession();
  const services = await db.service.findMany({
    where: { userId: session.userId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return ok({ services });
});

export const POST = apiHandler(async (req) => {
  const session = await requireSession();
  const data = ServiceSchema.parse(await req.json());
  const slugTaken = await db.service.findUnique({
    where: { userId_slug: { userId: session.userId, slug: data.slug } },
  });
  if (slugTaken) throw new ApiError(409, "Já existe um serviço com este slug.");
  const service = await db.service.create({
    data: {
      userId: session.userId,
      name: data.name,
      description: data.description ?? null,
      slug: data.slug,
      color: data.color,
      isActive: data.isActive,
      isPublic: data.isPublic,
      durationInMinutes: data.durationInMinutes,
      bufferTimeBefore: data.bufferTimeBefore,
      bufferTimeAfter: data.bufferTimeAfter,
      price: data.price,
      currency: data.currency,
      paymentRequired: data.paymentRequired,
      isVideoCall: data.isVideoCall,
      videoCallProvider: data.videoCallProvider ?? null,
      customMeetingUrl: data.customMeetingUrl ?? null,
      maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? null,
      minimumNoticeMinutes: data.minimumNoticeMinutes ?? null,
      maxParticipants: data.maxParticipants,
      position: data.position,
    },
  });
  return created({ service });
});