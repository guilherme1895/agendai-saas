import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";

export const GET = apiHandler(async () => {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new ApiError(404, "Usuário não encontrado.");
  const { password: _, ...safe } = user;
  return ok({ user: safe });
});