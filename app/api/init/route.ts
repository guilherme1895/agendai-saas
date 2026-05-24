import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

let initialized = false;

export async function GET() {
  if (!initialized) {
    await initDB();
    initialized = true;
  }
  return NextResponse.json({ ok: true });
}
