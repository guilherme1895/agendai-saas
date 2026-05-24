import { NextRequest, NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";
import { generateId } from "@/lib/utils";

let dbReady = false;

// POST /api/public/book
export async function POST(req: NextRequest) {
  if (!dbReady) { await initDB(); dbReady = true; }

  try {
    const { slug, clientName, clientEmail, date, startTime, endTime, notes } =
      await req.json();

    if (!slug || !clientName || !clientEmail || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    // Get provider
    const userResult = await db.execute({
      sql: "SELECT id FROM users WHERE slug = ?",
      args: [slug],
    });
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Prestador não encontrado." }, { status: 404 });
    }
    const userId = userResult.rows[0].id as string;

    // Check provider still has this slot available
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    const avResult = await db.execute({
      sql: "SELECT * FROM availability WHERE user_id = ? AND day_of_week = ?",
      args: [userId, dayOfWeek],
    });
    if (avResult.rows.length === 0) {
      return NextResponse.json({ error: "Prestador não atende neste dia." }, { status: 400 });
    }

    // Check slot conflict
    const conflict = await db.execute({
      sql: `SELECT id FROM appointments
            WHERE user_id = ? AND date = ? AND status = 'confirmed'
            AND NOT (end_time <= ? OR start_time >= ?)`,
      args: [userId, date, startTime, endTime],
    });

    if (conflict.rows.length > 0) {
      return NextResponse.json(
        { error: "Este horário acabou de ser ocupado. Escolha outro." },
        { status: 409 }
      );
    }

    const id = generateId();
    await db.execute({
      sql: `INSERT INTO appointments (id, user_id, client_name, client_email, date, start_time, end_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, clientName, clientEmail, date, startTime, endTime, notes || null],
    });

    return NextResponse.json({ id, ok: true }, { status: 201 });
  } catch (err) {
    console.error("Book error:", err);
    return NextResponse.json({ error: "Erro ao realizar agendamento." }, { status: 500 });
  }
}
