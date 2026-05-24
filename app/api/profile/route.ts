import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileSchema } from "@/lib/validators";
import type { UserRow } from "@/lib/types";

// GET /api/profile
export const GET = apiHandler(async () => {
  const session = await requireSession();
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [session.userId],
  });
  if (!result.rows.length) throw new ApiError(404, "Usuário não encontrado.");
  const user = result.rows[0] as unknown as UserRow;
  const { password: _, ...safe } = user;
  return ok({ user: safe });
});

// PUT /api/profile
export const PUT = apiHandler(async (req) => {
  const session = await requireSession();
  const data = ProfileSchema.parse(await req.json());

  // Slug único (excluindo o próprio usuário)
  const slugCheck = await db.execute({
    sql: "SELECT id FROM users WHERE slug = ? AND id != ?",
    args: [data.slug, session.userId],
  });
  if (slugCheck.rows.length > 0) throw new ApiError(409, "Este link já está em uso.");

  await db.execute({
    sql: `UPDATE users SET
            name = ?, slug = ?, bio = ?, phone = ?, timezone = ?,
            booking_page_title = ?, minimum_notice = ?, max_days_in_advance = ?,
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      data.name, data.slug, data.bio ?? null, data.phone ?? null, data.timezone,
      data.bookingPageTitle ?? null, data.minimumNotice, data.maxDaysInAdvance,
      session.userId,
    ],
  });

  const updated = await db.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [session.userId],
  });
  const user = updated.rows[0] as unknown as UserRow;
  const { password: _, ...safe } = user;
  return ok({ user: safe });
});
