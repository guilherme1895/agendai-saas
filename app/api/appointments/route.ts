import { NextRequest, NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateId } from "@/lib/utils";

let dbReady = false;

// GET /api/appointments - provider's appointments
export async function GET(req: NextRequest) {
  if (!dbReady) { await initDB(); dbReady = true; }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2024-01"
  const status = searchParams.get("status"); // "confirmed" | "cancelled" | null

  let sql = "SELECT * FROM appointments WHERE user_id = ?";
  const args: (string | number)[] = [session.userId];

  if (month) {
    sql += " AND date LIKE ?";
    args.push(`${month}%`);
  }
  if (status) {
    sql += " AND status = ?";
    args.push(status);
  }

  sql += " ORDER BY date ASC, start_time ASC";

  const result = await db.execute({ sql, args });
  return NextResponse.json({ appointments: result.rows });
}

// POST /api/appointments - provider cancels or creates manual appointment
export async function POST(req: NextRequest) {
  if (!dbReady) { await initDB(); dbReady = true; }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const { clientName, clientEmail, date, startTime, endTime, notes } = await req.json();

    if (!clientName || !clientEmail || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // Check conflict
    const conflict = await db.execute({
      sql: `SELECT id FROM appointments
            WHERE user_id = ? AND date = ? AND status = 'confirmed'
            AND NOT (end_time <= ? OR start_time >= ?)`,
      args: [session.userId, date, startTime, endTime],
    });

    if (conflict.rows.length > 0) {
      return NextResponse.json({ error: "Horário já ocupado." }, { status: 409 });
    }

    const id = generateId();
    await db.execute({
      sql: `INSERT INTO appointments (id, user_id, client_name, client_email, date, start_time, end_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, session.userId, clientName, clientEmail, date, startTime, endTime, notes || null],
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Appointment POST error:", err);
    return NextResponse.json({ error: "Erro ao criar agendamento." }, { status: 500 });
  }
}
