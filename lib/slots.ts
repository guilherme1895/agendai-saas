/**
 * Motor de cálculo de slots livres
 * Responsabilidades:
 *   1. Carregar blocos de disponibilidade do prestador para um dado dia
 *   2. Subtrair os agendamentos já existentes (com buffers)
 *   3. Respeitar: minimumNotice, maxDaysInAdvance, timezone do prestador
 *   4. Retornar slots prontos para exibição
 */

import { db } from "./db";
import { generateSlots, intervalsOverlap, timeToMinutes } from "./utils";
import type { AvailabilityRow, BookingRow, ServiceRow, UserRow } from "./types";

export interface FreeSlot {
  startTime: string; // "HH:MM" no timezone do prestador
  endTime: string;
}

export async function getFreeSlotsForDate(
  user: UserRow,
  service: ServiceRow,
  dateStr: string // "YYYY-MM-DD" no timezone do prestador
): Promise<FreeSlot[]> {
  const now = new Date();

  // --- 1. Validações de janela de agendamento ---
  const [y, mo, d] = dateStr.split("-").map(Number);
  const requestedDate = new Date(y, mo - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (requestedDate < today) return [];

  const maxDays = service.max_advance_booking_days ?? user.max_days_in_advance;
  const diffDays = Math.round(
    (requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays > maxDays) return [];

  // --- 2. Dia da semana (0 = Dom) ---
  const dayOfWeek = requestedDate.getDay();

  // --- 3. Buscar blocos de disponibilidade (serviço específico > global) ---
  const avResult = await db.execute({
    sql: `SELECT * FROM availability
          WHERE user_id = ?
            AND (service_id = ? OR service_id IS NULL)
            AND day_of_week = ?
            AND is_active = 1
          ORDER BY service_id DESC, start_time ASC`,
    args: [user.id, service.id, dayOfWeek],
  });

  const allBlocks = avResult.rows as unknown as AvailabilityRow[];

  // Se o serviço tiver regras próprias, usa só elas; senão, usa as globais
  const serviceBlocks = allBlocks.filter((b) => b.service_id === service.id);
  const blocks = serviceBlocks.length > 0 ? serviceBlocks : allBlocks.filter((b) => !b.service_id);

  if (blocks.length === 0) return [];

  // --- 4. Gerar todos os slots possíveis dentro de cada bloco ---
  const candidateSlots: FreeSlot[] = [];
  for (const block of blocks) {
    const generated = generateSlots(
      block.start_time,
      block.end_time,
      service.duration_in_minutes,
      service.buffer_time_before,
      service.buffer_time_after,
    );
    candidateSlots.push(...generated.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
    })));
  }

  // --- 5. Buscar agendamentos já existentes nesse dia ---
  const bookedResult = await db.execute({
    sql: `SELECT start_at, end_at, status FROM bookings
          WHERE user_id = ?
            AND date(start_at) = ?
            AND status NOT IN ('cancelled_by_provider', 'cancelled_by_customer')`,
    args: [user.id, dateStr],
  });

  // Extrai HH:MM dos timestamps UTC
  // (Simplificação: armazenamos HH:MM direto em start_at para SQLite)
  const busySlots = (bookedResult.rows as unknown as BookingRow[]).map((b) => {
    // Se start_at está em ISO (ex: "2024-01-15T09:00:00.000Z"), extrai HH:MM
    const startTime = b.start_at.includes("T")
      ? b.start_at.slice(11, 16)
      : b.start_at.slice(11, 16);
    const endTime = b.end_at.includes("T")
      ? b.end_at.slice(11, 16)
      : b.end_at.slice(11, 16);
    return { startTime, endTime };
  });

  // --- 6. Filtrar slots ocupados (considera buffer do serviço) ---
  const freeSlots = candidateSlots.filter((slot) => {
    // Expande o slot com os buffers para verificar colisão real
    const slotWithBuffer = {
      startTime: minutesToTimeOffset(slot.startTime, -service.buffer_time_before),
      endTime: minutesToTimeOffset(slot.endTime, service.buffer_time_after),
    };

    return !busySlots.some((busy) =>
      intervalsOverlap(
        slotWithBuffer.startTime, slotWithBuffer.endTime,
        busy.startTime, busy.endTime,
      )
    );
  });

  // --- 7. Filtrar pelo minimumNotice (antecedência mínima) ---
  const minNoticeMs =
    (service.minimum_notice_minutes ?? user.minimum_notice) * 60 * 1000;
  const cutoff = new Date(now.getTime() + minNoticeMs);

  return freeSlots.filter((slot) => {
    if (diffDays > 0) return true; // Dias futuros: sempre ok
    // Hoje: verificar se o slot ainda está no futuro considerando o notice
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const slotDate = new Date(y, mo - 1, d, sh, sm);
    return slotDate >= cutoff;
  });
}

function minutesToTimeOffset(time: string, offsetMinutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.max(0, h * 60 + m + offsetMinutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// Re-export para uso externo
export { timeToMinutes };
