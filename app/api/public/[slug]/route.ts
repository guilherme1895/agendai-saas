import { apiHandler, ok } from "@/lib/api";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRow } from "@/lib/types";

type Ctx = { params: Promise<{ slug: string }> };

// GET /api/public/[slug] — informações públicas do prestador
export const GET = apiHandler(async (_, ctx: Ctx) => {
  const { slug } = await ctx.params;

  const result = await db.execute({
    sql: `SELECT id, name, slug, bio, timezone, booking_page_title, booking_page_banner, image
          FROM users WHERE slug = ?`,
    args: [slug],
  });
  if (!result.rows.length) throw new ApiError(404, "Perfil não encontrado.");
  const user = result.rows[0] as unknown as Partial<UserRow>;

  // Serviços públicos e ativos
  const services = await db.execute({
    sql: `SELECT id, name, description, slug, color, duration_in_minutes,
                 buffer_time_before, buffer_time_after, price, currency,
                 payment_required, is_video_call, video_call_provider, max_participants
          FROM services
          WHERE user_id = ? AND is_active = 1 AND is_public = 1
          ORDER BY position ASC`,
    args: [user.id as string],
  });

  return ok({ provider: user, services: services.rows });
});
