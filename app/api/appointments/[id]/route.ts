import { NextRequest, NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";
import { getSession } from "@/lib/auth";

let dbReady = false;

// PATCH /api/appointments/[id] - cancel appointment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!dbReady) { await initDB(); dbReady = true; }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  // Ensure the appointment belongs to this user
  const existing = await db.execute({
    sql: "SELECT id FROM appointments WHERE id = ? AND user_id = ?",
    args: [id, session.userId],
  });

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  await db.execute({
    sql: "UPDATE appointments SET status = ? WHERE id = ?",
    args: [status || "cancelled", id],
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/appointments/[id] - permanently delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!dbReady) { await initDB(); dbReady = true; }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  await db.execute({
    sql: "DELETE FROM appointments WHERE id = ? AND user_id = ?",
    args: [id, session.userId],
  });

  return NextResponse.json({ ok: true });
}
