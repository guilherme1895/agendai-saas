import { apiHandler, ok } from "@/lib/api";
import { requireSession, getCurrentUser } from "@/lib/auth";
import { ApiError } from "@/lib/auth";

export const GET = apiHandler(async () => {
  await requireSession();
  const user = await getCurrentUser();
  if (!user) throw new ApiError(404, "Usuário não encontrado.");
  const { password: _, ...safe } = user;
  return ok({ user: safe });
});
