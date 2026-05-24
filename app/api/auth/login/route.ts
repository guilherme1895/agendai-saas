import { NextResponse } from "next/server";
import { apiHandler, ok } from "@/lib/api";
import { ApiError, comparePassword, createToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginSchema } from "@/lib/validators";
import type { UserRow } from "@/lib/types";

export const POST = apiHandler(async (req) => {
  const data = LoginSchema.parse(await req.json());

  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [data.email],
  });
  if (result.rows.length === 0) {
    throw new ApiError(401, "E-mail ou senha incorretos.");
  }

  const user = result.rows[0] as unknown as UserRow;
  if (!user.password) throw new ApiError(401, "Use o login social para esta conta.");

  const valid = await comparePassword(data.password, user.password);
  if (!valid) throw new ApiError(401, "E-mail ou senha incorretos.");

  const token = await createToken({ userId: user.id, email: user.email });

  const res = ok({
    user: { id: user.id, name: user.name, email: user.email, slug: user.slug, timezone: user.timezone },
  });
  res.headers.set(
    "Set-Cookie",
    `agendai_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax`
  );
  return res;
});
