import { NextResponse } from "next/server";
import { apiHandler, ok } from "@/lib/api";
import { processPendingNotifications } from "@/lib/notifications";

/**
 * POST /api/notifications/process
 * Deve ser chamado por um cron job (ex: Vercel Cron, GitHub Actions, cron-job.org)
 * Protegido por CRON_SECRET para evitar chamadas não autorizadas.
 */
export const POST = apiHandler(async (req) => {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Em produção, exige o secret. Em dev, permite sem auth.
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const limit = 50;
  const result = await processPendingNotifications(limit);

  return ok({
    ok: true,
    processed: result.processed,
    failed: result.failed,
    timestamp: new Date().toISOString(),
  });
});
