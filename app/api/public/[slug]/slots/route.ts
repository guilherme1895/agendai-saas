import { apiHandler, ok } from "@/lib/api";
import { ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFreeSlotsForDate } from "@/lib/slots";
import { addDays, format } from "date-fns";
import type { UserRow, ServiceRow } from "@/lib/types";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * GET /api/public/[slug]/slots?serviceId=xxx&date=2024-01-15
 *
 * Ou sem date: retorna os próximos 30 dias com slots disponíveis
 * (útil para pintar o calendário de datas disponíveis)
 */
export const GET = apiHandler(async (req, ctx: Ctx) => {
  const { slug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // "YYYY-MM-DD" opcional

  if (!serviceId) throw new ApiError(400, "serviceId é obrigatório.");

  // Busca provider
  const userRes = await db.execute({
    sql: "SELECT * FROM users WHERE slug = ?",
    args: [slug],
  });
  if (!userRes.rows.length) throw new ApiError(404, "Prestador não encontrado.");
  const user = userRes.rows[0] as unknown as UserRow;

  // Busca serviço
  const svcRes = await db.execute({
    sql: "SELECT * FROM services WHERE id = ? AND user_id = ? AND is_active = 1 AND is_public = 1",
    args: [serviceId, user.id],
  });
  if (!svcRes.rows.length) throw new ApiError(404, "Serviço não encontrado.");
  const service = svcRes.rows[0] as unknown as ServiceRow;

  if (date) {
    // Slots para um dia específico
    const slots = await getFreeSlotsForDate(user, service, date);
    return ok({ slots, date });
  }

  // Sem date: varre os próximos N dias e retorna quais têm pelo menos 1 slot
  const maxDays = service.max_advance_booking_days ?? user.max_days_in_advance;
  const daysWithSlots: string[] = [];
  const today = new Date();

  for (let i = 0; i <= maxDays; i++) {
    const d = addDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const slots = await getFreeSlotsForDate(user, service, dateStr);
    if (slots.length > 0) daysWithSlots.push(dateStr);
  }

  return ok({ availableDates: daysWithSlots });
});
