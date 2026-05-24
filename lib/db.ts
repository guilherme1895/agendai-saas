import { createClient, type Client } from "@libsql/client";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __db: Client | undefined;
}

function createDB(): Client {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  return createClient({ url: `file:${dbPath}` });
}

export const db: Client = global.__db ?? createDB();

if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

let _initialized = false;

export async function initDB(): Promise<void> {
  if (_initialized) return;

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      email_verified TEXT, image TEXT, password TEXT,
      slug TEXT UNIQUE NOT NULL, bio TEXT, phone TEXT,
      timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
      booking_page_title TEXT, booking_page_banner TEXT,
      minimum_notice INTEGER NOT NULL DEFAULT 60,
      max_days_in_advance INTEGER NOT NULL DEFAULT 60,
      stripe_customer_id TEXT UNIQUE, stripe_account_id TEXT UNIQUE,
      stripe_account_status TEXT, plan TEXT NOT NULL DEFAULT 'free',
      plan_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, type TEXT NOT NULL,
      provider TEXT NOT NULL, provider_account_id TEXT NOT NULL,
      refresh_token TEXT, access_token TEXT, expires_at INTEGER,
      token_type TEXT, scope TEXT, id_token TEXT, session_state TEXT,
      google_calendar_id TEXT, google_calendar_enabled INTEGER NOT NULL DEFAULT 0,
      google_calendar_sync_token TEXT, google_calendar_last_sync_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_account_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, session_token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL, expires TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL, token TEXT UNIQUE NOT NULL, expires TEXT NOT NULL,
      UNIQUE(identifier, token)
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      description TEXT, slug TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#22c55e',
      is_active INTEGER NOT NULL DEFAULT 1, is_public INTEGER NOT NULL DEFAULT 1,
      duration_in_minutes INTEGER NOT NULL,
      buffer_time_before INTEGER NOT NULL DEFAULT 0,
      buffer_time_after INTEGER NOT NULL DEFAULT 0,
      price INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'BRL',
      payment_required INTEGER NOT NULL DEFAULT 0,
      is_video_call INTEGER NOT NULL DEFAULT 0,
      video_call_provider TEXT, custom_meeting_url TEXT,
      max_advance_booking_days INTEGER, minimum_notice_minutes INTEGER,
      max_participants INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, slug)
    );

    CREATE TABLE IF NOT EXISTS availability (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, service_id TEXT,
      day_of_week INTEGER NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_avail_user_svc_day ON availability(user_id, service_id, day_of_week);

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      email TEXT NOT NULL, phone TEXT, notes TEXT, tags TEXT, source TEXT,
      total_bookings INTEGER NOT NULL DEFAULT 0,
      total_spent_cents INTEGER NOT NULL DEFAULT 0,
      last_booking_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, email)
    );
    CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id, last_booking_at);

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, service_id TEXT NOT NULL,
      customer_id TEXT NOT NULL, start_at TEXT NOT NULL, end_at TEXT NOT NULL,
      customer_timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
      status TEXT NOT NULL DEFAULT 'confirmed', cancelled_at TEXT, cancel_reason TEXT,
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      stripe_payment_intent_id TEXT UNIQUE, stripe_charge_id TEXT UNIQUE,
      paid_amount_cents INTEGER NOT NULL DEFAULT 0, paid_at TEXT,
      refunded_amount_cents INTEGER NOT NULL DEFAULT 0, refunded_at TEXT,
      meeting_url TEXT, google_calendar_event_id TEXT,
      customer_notes TEXT, internal_notes TEXT,
      manage_token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
      FOREIGN KEY (service_id)  REFERENCES services(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_user_start  ON bookings(user_id, start_at);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_customer    ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_token       ON bookings(manage_token);

    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY, booking_id TEXT NOT NULL,
      type TEXT NOT NULL, template TEXT NOT NULL, recipient TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      provider_message_id TEXT, error_message TEXT,
      subject TEXT, body TEXT, scheduled_for TEXT, sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notif_booking          ON notification_logs(booking_id);
    CREATE INDEX IF NOT EXISTS idx_notif_status_scheduled ON notification_logs(status, scheduled_for);
  `);

  _initialized = true;
}
