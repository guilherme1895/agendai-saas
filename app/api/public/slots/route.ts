import { NextRequest, NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";

let dbReady = false;

// GET /api/public/slots?slug=joao-silva&date=2024-01-15
export async function GET(req: NextRequest) {
  if (!dbReady) { await initDB(); dbReady = true; }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const date = searchParams.get("date"); // "2024-01-15"

  if (!slug || !date) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  // Get provider
  const userResult = await db.execute({
    sql: "SELECT id, name, bio FROM users WHERE slug = ?",
    args: [slug],
  });
  if (userResult.rows.length === 0) {
    return NextResponse.json({ error: "Prestador não encontrado." }, { status: 404 });
  }
  const user = userResult.rows[0];

  // Get day of week (0=Sun, 1=Mon, ...)
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  // Get availability for this day
  const avResult = await db.execute({
    sql: "SELECT * FROM availability WHERE user_id = ? AND day_of_week = ?",
    args: [user.id as string, dayOfWeek],
  });

  if (avResult.rows.length === 0) {
    return NextResponse.json({ slots: [], provider: user });
  }

  const av = avResult.rows[0];
  const slotDuration = (av.slot_duration_minutes as number) || 60;

  // Generate all possible slots
  const allSlots = generateSlots(
    av.start_time as string,
    av.end_time as string,
    slotDuration
  );

  // Get already booked slots for this date
  const bookedResult = await db.execute({
    sql: "SELECT start_time, end_time FROM appointments WHERE user_id = ? AND date = ? AND status = 'confirmed'",
    args: [user.id as string, date],
  });

  const booked = bookedResult.rows.map((r) => ({
    start: r.start_time as string,
    end: r.end_time as string,
  }));

  // Filter out booked slots
  const freeSlots = allSlots.filter((slot) => {
    return !booked.some(
      (b) =>
        !(timeToMinutes(slot.end) <= timeToMinutes(b.start) ||
          timeToMinutes(slot.start) >= timeToMinutes(b.end))
    );
  });

  return NextResponse.json({ slots: freeSlots, provider: user });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlots(startTime: string, endTime: string, durationMinutes: number) {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + durationMinutes <= end) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + durationMinutes),
    });
    current += durationMinutes;
  }

  return slots;
}
