import { apiHandler, ok } from "@/lib/api";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";

type Ctx = { params: Promise<{ slug: string }> };

// GET /api/public/[slug]/services — lista serviços públicos
export const GET = apiHandler(async (_, ctx: Ctx) => {
  const { slug } = await ctx.params;

  const user = await db.execute({
    sql: "SELECT id FROM users WHERE slug = ?",
    args: [slug],
  });
  if (!user.rows.length) throw new ApiError(404, "Prestador não encontrado.");
  const userId = user.rows[0].id as string;

  const services = await db.execute({
    sql: `SELECT id, name, description, slug, color, duration_in_minutes,
                 buffer_time_before, buffer_time_after, price, currency,
                 payment_required, is_video_call, video_call_provider, max_participants, position
          FROM services
          WHERE user_id = ? AND is_active = 1 AND is_public = 1
          ORDER BY position ASC`,
    args: [userId],
  });

  return ok({ services: services.rows });
});
