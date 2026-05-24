import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `c${timestamp}${random}`;
}

// ---------------------------------------------------------------------------
// Slugs
// ---------------------------------------------------------------------------
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ---------------------------------------------------------------------------
// Tempo: converte "HH:MM" <-> minutos desde meia-noite
// ---------------------------------------------------------------------------
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Gera slots de tempo dentro de um bloco, respeitando buffer
// bufferBefore / bufferAfter: espaço NÃO reservável ao redor de cada slot
// ---------------------------------------------------------------------------
export function generateSlots(
  blockStart: string,   // "09:00"
  blockEnd: string,     // "18:00"
  durationMin: number,  // duração do serviço
  bufferBefore: number, // buffer antes (desconta do tempo disponível)
  bufferAfter: number,  // buffer depois
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  const step = bufferBefore + durationMin + bufferAfter;
  let cursor = timeToMinutes(blockStart) + bufferBefore;
  const end = timeToMinutes(blockEnd);

  while (cursor + durationMin <= end) {
    slots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor + durationMin),
    });
    cursor += step;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Verifica se dois intervalos se sobrepõem (inclusive buffers)
// ---------------------------------------------------------------------------
export function intervalsOverlap(
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean {
  const aS = timeToMinutes(aStart);
  const aE = timeToMinutes(aEnd);
  const bS = timeToMinutes(bStart);
  const bE = timeToMinutes(bEnd);
  return aS < bE && aE > bS;
}

// ---------------------------------------------------------------------------
// Formata centavos para moeda
// ---------------------------------------------------------------------------
export function formatCurrency(cents: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Constantes de dias da semana
// ---------------------------------------------------------------------------
export const DAY_NAMES = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];
export const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Alias para compatibilidade com código anterior
export const generateSlug = slugify;
