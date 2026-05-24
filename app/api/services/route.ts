import { apiHandler, ok, created } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { ServiceSchema } from "@/lib/validators";
import { generateCuid } from "@/lib/utils";
import type { ServiceRow } from "@/lib/types";

// GET /api/services
export const GET = apiHandler(async () => {
  const session = await requireSession();
  const result = await db.execute({
    sql: "SELECT * FROM services WHERE user_id = ? ORDER BY position ASC, created_at ASC",
    args: [session.userId],
  });
  return ok({ services: result.rows });
});

// POST /api/services
export const POST = apiHandler(async (req) => {
  const session = await requireSession();
  const data = ServiceSchema.parse(await req.json());

  // Slug único por usuário
  const slugCheck = await db.execute({
    sql: "SELECT id FROM services WHERE user_id = ? AND slug = ?",
    args: [session.userId, data.slug],
  });
  if (slugCheck.rows.length > 0) throw new ApiError(409, "Já existe um serviço com este slug.");

  const id = generateCuid();
  await db.execute({
    sql: `INSERT INTO services (
            id, user_id, name, description, slug, color, is_active, is_public,
            duration_in_minutes, buffer_time_before, buffer_time_after,
            price, currency, payment_required, is_video_call, video_call_provider,
            custom_meeting_url, max_advance_booking_days, minimum_notice_minutes,
            max_participants, position
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      id, session.userId, data.name, data.description ?? null, data.slug,
      data.color, data.isActive ? 1 : 0, data.isPublic ? 1 : 0,
      data.durationInMinutes, data.bufferTimeBefore, data.bufferTimeAfter,
      data.price, data.currency, data.paymentRequired ? 1 : 0,
      data.isVideoCall ? 1 : 0, data.videoCallProvider ?? null,
      data.customMeetingUrl ?? null, data.maxAdvanceBookingDays ?? null,
      data.minimumNoticeMinutes ?? null, data.maxParticipants, data.position,
    ],
  });

  const svc = await db.execute({ sql: "SELECT * FROM services WHERE id = ?", args: [id] });
  return created({ service: svc.rows[0] });
});
