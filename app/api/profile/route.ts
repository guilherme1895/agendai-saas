import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileSchema } from "@/lib/validators";

export const GET = apiHandler(async () => {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new ApiError(404, "Usuário não encontrado.");
  const { password: _, ...safe } = user;
  return ok({ user: safe });
});

export const PUT = apiHandler(async (req) => {
  const session = await requireSession();
  const data = ProfileSchema.parse(await req.json());
  const slugTaken = await db.user.findFirst({
    where: { slug: data.slug, id: { not: session.userId } },
  });
  if (slugTaken) throw new ApiError(409, "Este link já está em uso.");
  const user = await db.user.update({
    where: { id: session.userId },
    data: {
      name: data.name,
      slug: data.slug,
      bio: data.bio ?? null,
      phone: data.phone ?? null,
      timezone: data.timezone,
      bookingPageTitle: data.bookingPageTitle ?? null,
      minimumNotice: data.minimumNotice,
      maxDaysInAdvance: data.maxDaysInAdvance,
    },
  });
  const { password: _, ...safe } = user;
  return ok({ user: safe });
});