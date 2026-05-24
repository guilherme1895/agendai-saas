import { NextResponse } from "next/server";
import { apiHandler, ok, created } from "@/lib/api";
import { ApiError, hashPassword, createToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/lib/validators";
import { generateCuid, slugify } from "@/lib/utils";

export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const data = RegisterSchema.parse(body);

  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [data.email],
  });
  if (existing.rows.length > 0) {
    throw new ApiError(409, "E-mail já cadastrado.");
  }

  const id = generateCuid();
  const hashed = await hashPassword(data.password);

  // Garante slug único
  let slug = slugify(data.name);
  const slugExists = await db.execute({
    sql: "SELECT id FROM users WHERE slug = ?",
    args: [slug],
  });
  if (slugExists.rows.length > 0) slug = `${slug}-${id.slice(-4)}`;

  await db.execute({
    sql: `INSERT INTO users (id, name, email, password, slug, timezone)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, data.name, data.email, hashed, slug, data.timezone],
  });

  const token = await createToken({ userId: id, email: data.email });

  const res = created({ user: { id, name: data.name, email: data.email, slug } });
  res.headers.set(
    "Set-Cookie",
    `agendai_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax`
  );
  return res;
});
