import { apiHandler, ok, created } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { createConnectAccount, getStripeDashboardLink } from "@/lib/stripe";
import type { UserRow } from "@/lib/types";

// GET /api/integrations/stripe — status da conta Stripe Connect
export const GET = apiHandler(async () => {
  const session = await requireSession();

  const result = await db.execute({
    sql: "SELECT stripe_account_id, stripe_account_status FROM users WHERE id = ?",
    args: [session.userId],
  });
  const user = result.rows[0] as unknown as Partial<UserRow>;

  if (!user.stripe_account_id) {
    return ok({ connected: false });
  }

  // Gera link temporário para o dashboard Express
  let dashboardUrl: string | null = null;
  try {
    dashboardUrl = await getStripeDashboardLink(user.stripe_account_id);
  } catch {
    // Ignora se falhar (conta pode estar incompleta)
  }

  return ok({
    connected: true,
    accountId: user.stripe_account_id,
    status: user.stripe_account_status ?? "pending",
    dashboardUrl,
  });
});

// POST /api/integrations/stripe — inicia onboarding Stripe Connect
export const POST = apiHandler(async () => {
  const session = await requireSession();

  const result = await db.execute({
    sql: "SELECT email, stripe_account_id FROM users WHERE id = ?",
    args: [session.userId],
  });
  const user = result.rows[0] as unknown as Partial<UserRow>;

  // Se já tem conta, retorna link de reacesso ao onboarding
  if (user.stripe_account_id) {
    const { onboardingUrl } = await createConnectAccount({
      email: user.email as string,
    });
    return ok({ onboardingUrl, existing: true });
  }

  const { accountId, onboardingUrl } = await createConnectAccount({
    email: user.email as string,
  });

  await db.execute({
    sql: "UPDATE users SET stripe_account_id = ?, stripe_account_status = 'pending', updated_at = datetime('now') WHERE id = ?",
    args: [accountId, session.userId],
  });

  return created({ accountId, onboardingUrl });
});
