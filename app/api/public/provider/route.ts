import { NextRequest, NextResponse } from "next/server";
import { db, initDB } from "@/lib/db";

let dbReady = false;

// GET /api/public/provider?slug=joao-silva
export async function GET(req: NextRequest) {
  if (!dbReady) { await initDB(); dbReady = true; }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug inválido." }, { status: 400 });
  }

  const result = await db.execute({
    sql: "SELECT id, name, bio, slug FROM users WHERE slug = ?",
    args: [slug],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Prestador não encontrado." }, { status: 404 });
  }

  const user = result.rows[0];

  // Get availability days
  const avResult = await db.execute({
    sql: "SELECT day_of_week, start_time, end_time, slot_duration_minutes FROM availability WHERE user_id = ? ORDER BY day_of_week",
    args: [user.id as string],
  });

  return NextResponse.json({
    provider: { name: user.name, bio: user.bio, slug: user.slug },
    availability: avResult.rows,
  });
}
