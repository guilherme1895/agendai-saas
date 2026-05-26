import { NextResponse } from "next/server";
import { apiHandler, created } from "@/lib/api";
import { ApiError, hashPassword, createToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { RegisterSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export const POST = apiHandler(async (req) => {
  const data = RegisterSchema.parse(await req.json());
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "E-mail já cadastrado.");
  const hashed = await hashPassword(data.password);
  let slug = slugify(data.name);
  const slugExists = await db.user.findUnique({ where: { slug } });
  if (slugExists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      slug,
      timezone: data.timezone,
    },
  });
  const token = await createToken({ userId: user.id, email: user.email });
  const res = created({ user: { id: user.id, name: user.name, email: user.email, slug: user.slug } });
  res.headers.set("Set-Cookie", `agendai_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax`);
  return res;
});