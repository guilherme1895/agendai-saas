import { apiHandler, ok } from "@/lib/api";

export const POST = apiHandler(async () => {
  const res = ok({ ok: true });
  res.headers.set("Set-Cookie", "agendai_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
  return res;
});