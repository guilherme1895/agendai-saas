import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AvailabilitySchema } from "@/lib/validators";
import { generateCuid } from "@/lib/utils";

// GET /api/availability?serviceId=xxx
export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");

  const result = await db.execute({
    sql: `SELECT * FROM availability
          WHERE user_id = ?
            AND (service_id = ? OR (? IS NULL AND service_id IS NULL))
          ORDER BY day_of_week ASC, start_time ASC`,
    args: [session.userId, serviceId, serviceId],
  });

  return ok({ availability: result.rows });
});

// PUT /api/availability — substitui todos os blocos do usuário/serviço
export const PUT = apiHandler(async (req) => {
  const session = await requireSession();
  const data = AvailabilitySchema.parse(await req.json());

  // Valida que os blocos fazem sentido (end > start)
  for (const block of data.blocks) {
    if (block.startTime >= block.endTime) {
      throw new Error(`Bloco inválido no dia ${block.dayOfWeek}: início deve ser antes do fim.`);
    }
  }

  // Apaga blocos anteriores do escopo (global ou por serviço)
  if (data.serviceId) {
    await db.execute({
      sql: "DELETE FROM availability WHERE user_id = ? AND service_id = ?",
      args: [session.userId, data.serviceId],
    });
  } else {
    await db.execute({
      sql: "DELETE FROM availability WHERE user_id = ? AND service_id IS NULL",
      args: [session.userId],
    });
  }

  // Insere novos blocos
  for (const block of data.blocks) {
    await db.execute({
      sql: `INSERT INTO availability (id, user_id, service_id, day_of_week, start_time, end_time, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        generateCuid(),
        session.userId,
        data.serviceId ?? null,
        block.dayOfWeek,
        block.startTime,
        block.endTime,
        block.isActive ? 1 : 0,
      ],
    });
  }

  return ok({ ok: true, count: data.blocks.length });
});
