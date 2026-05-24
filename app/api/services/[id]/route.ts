import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceSchema } from "@/lib/validators";
import type { ServiceRow } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnService(userId: string, id: string): Promise<ServiceRow> {
  const r = await db.execute({
    sql: "SELECT * FROM services WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  if (!r.rows.length) throw new ApiError(404, "Serviço não encontrado.");
  return r.rows[0] as unknown as ServiceRow;
}

// GET /api/services/[id]
export const GET = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const svc = await getOwnService(session.userId, id);
  return ok({ service: svc });
});

// PUT /api/services/[id]
export const PUT = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwnService(session.userId, id);
  const data = ServiceSchema.parse(await req.json());

  // Slug único (excluindo o próprio serviço)
  const slugCheck = await db.execute({
    sql: "SELECT id FROM services WHERE user_id = ? AND slug = ? AND id != ?",
    args: [session.userId, data.slug, id],
  });
  if (slugCheck.rows.length > 0) throw new ApiError(409, "Slug já em uso.");

  await db.execute({
    sql: `UPDATE services SET
            name=?, description=?, slug=?, color=?, is_active=?, is_public=?,
            duration_in_minutes=?, buffer_time_before=?, buffer_time_after=?,
            price=?, currency=?, payment_required=?, is_video_call=?,
            video_call_provider=?, custom_meeting_url=?,
            max_advance_booking_days=?, minimum_notice_minutes=?,
            max_participants=?, position=?, updated_at=datetime('now')
          WHERE id=? AND user_id=?`,
    args: [
      data.name, data.description ?? null, data.slug, data.color,
      data.isActive ? 1 : 0, data.isPublic ? 1 : 0,
      data.durationInMinutes, data.bufferTimeBefore, data.bufferTimeAfter,
      data.price, data.currency, data.paymentRequired ? 1 : 0,
      data.isVideoCall ? 1 : 0, data.videoCallProvider ?? null,
      data.customMeetingUrl ?? null, data.maxAdvanceBookingDays ?? null,
      data.minimumNoticeMinutes ?? null, data.maxParticipants, data.position,
      id, session.userId,
    ],
  });

  const updated = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [id] });
  return ok({ service: updated.rows[0] });
});

// DELETE /api/services/[id]
export const DELETE = apiHandler(async (_, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  await getOwnService(session.userId, id);
  await db.execute({ sql: "DELETE FROM services WHERE id = ? AND user_id = ?", args: [id, session.userId] });
  return ok({ ok: true });
});
