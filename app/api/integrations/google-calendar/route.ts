import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/integrations/google-calendar — status da integração
export const GET = apiHandler(async () => {
  const session = await requireSession();

  const account = await db.execute({
    sql: `SELECT google_calendar_id, google_calendar_enabled, google_calendar_last_sync_at
          FROM accounts
          WHERE user_id = ? AND provider = 'google'`,
    args: [session.userId],
  });

  if (!account.rows.length) {
    return ok({ connected: false });
  }

  const acc = account.rows[0] as Record<string, unknown>;
  return ok({
    connected: true,
    calendarEnabled: Boolean(acc.google_calendar_enabled),
    calendarId: acc.google_calendar_id ?? null,
    lastSyncAt: acc.google_calendar_last_sync_at ?? null,
  });
});

// PATCH /api/integrations/google-calendar — liga/desliga sincronização
export const PATCH = apiHandler(async (req) => {
  const session = await requireSession();
  const { enabled, calendarId } = await req.json() as {
    enabled: boolean;
    calendarId?: string;
  };

  const account = await db.execute({
    sql: "SELECT id FROM accounts WHERE user_id = ? AND provider = 'google'",
    args: [session.userId],
  });
  if (!account.rows.length) {
    throw new ApiError(404, "Conta Google não conectada.");
  }

  await db.execute({
    sql: `UPDATE accounts SET
            google_calendar_enabled = ?,
            google_calendar_id = COALESCE(?, google_calendar_id),
            updated_at = datetime('now')
          WHERE user_id = ? AND provider = 'google'`,
    args: [enabled ? 1 : 0, calendarId ?? null, session.userId],
  });

  return ok({ ok: true, enabled });
});

// DELETE /api/integrations/google-calendar — desconecta conta Google
export const DELETE = apiHandler(async () => {
  const session = await requireSession();

  await db.execute({
    sql: "DELETE FROM accounts WHERE user_id = ? AND provider = 'google'",
    args: [session.userId],
  });

  return ok({ ok: true, disconnected: true });
});
