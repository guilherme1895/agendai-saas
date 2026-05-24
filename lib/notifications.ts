/**
 * Motor de notificações
 * - Enfileira notificações no banco (status = PENDING)
 * - Processa envios (a ser chamado por cron/worker)
 * - Suporta EMAIL, WHATSAPP, SMS (providers plugáveis)
 */

import { db } from "./db";
import { generateCuid } from "./utils";
import type { BookingRow, CustomerRow, ServiceRow, UserRow, NotifTemplate, NotifType } from "./types";
import { addHours } from "date-fns";

// ---------------------------------------------------------------------------
// Enfileira logs de notificação para um agendamento
// ---------------------------------------------------------------------------
export async function scheduleBookingNotifications(
  booking: BookingRow,
  customer: CustomerRow,
  service: ServiceRow,
  provider: UserRow
): Promise<void> {
  const startAt = new Date(booking.start_at);

  const notifications: Array<{
    type: NotifType;
    template: NotifTemplate;
    recipient: string;
    subject: string;
    scheduledFor: Date | null;
  }> = [
    // Confirmação imediata para o cliente
    {
      type: "EMAIL",
      template: "booking_confirmed",
      recipient: customer.email,
      subject: `Agendamento confirmado — ${service.name}`,
      scheduledFor: null, // imediato
    },
    // Lembrete 24h antes
    {
      type: "EMAIL",
      template: "booking_reminder_24h",
      recipient: customer.email,
      subject: `Lembrete: ${service.name} amanhã`,
      scheduledFor: addHours(startAt, -24),
    },
    // Lembrete 1h antes
    {
      type: "EMAIL",
      template: "booking_reminder_1h",
      recipient: customer.email,
      subject: `Em 1 hora: ${service.name}`,
      scheduledFor: addHours(startAt, -1),
    },
  ];

  // Adiciona WhatsApp se o cliente tiver telefone
  if (customer.phone) {
    notifications.push({
      type: "WHATSAPP",
      template: "booking_confirmed",
      recipient: customer.phone,
      subject: "",
      scheduledFor: null,
    });
  }

  for (const n of notifications) {
    // Não enfileira lembretes que já passaram
    if (n.scheduledFor && n.scheduledFor < new Date()) continue;

    await db.execute({
      sql: `INSERT INTO notification_logs
              (id, booking_id, type, template, recipient, status, subject, scheduled_for)
            VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
      args: [
        generateCuid(),
        booking.id,
        n.type,
        n.template,
        n.recipient,
        n.subject || null,
        n.scheduledFor ? n.scheduledFor.toISOString() : null,
      ],
    });
  }
}

// ---------------------------------------------------------------------------
// Enfileira notificação de cancelamento
// ---------------------------------------------------------------------------
export async function scheduleCancellationNotification(
  booking: BookingRow,
  customer: CustomerRow,
  service: ServiceRow
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO notification_logs
            (id, booking_id, type, template, recipient, status, subject, scheduled_for)
          VALUES (?, ?, 'EMAIL', 'booking_cancelled', ?, 'PENDING', ?, NULL)`,
    args: [
      generateCuid(),
      booking.id,
      customer.email,
      `Agendamento cancelado — ${service.name}`,
    ],
  });
}

// ---------------------------------------------------------------------------
// Processa notificações pendentes (chamado pelo cron /api/notifications/process)
// ---------------------------------------------------------------------------
export async function processPendingNotifications(limit = 50): Promise<{
  processed: number;
  failed: number;
}> {
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `SELECT * FROM notification_logs
          WHERE status = 'PENDING'
            AND (scheduled_for IS NULL OR scheduled_for <= ?)
          ORDER BY created_at ASC
          LIMIT ?`,
    args: [now, limit],
  });

  let processed = 0;
  let failed = 0;

  for (const row of result.rows) {
    try {
      await sendNotification(row as Record<string, unknown>);
      await db.execute({
        sql: `UPDATE notification_logs
              SET status = 'SENT', sent_at = ?
              WHERE id = ?`,
        args: [now, row.id as string],
      });
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await db.execute({
        sql: `UPDATE notification_logs
              SET status = 'FAILED', error_message = ?
              WHERE id = ?`,
        args: [msg, row.id as string],
      });
      failed++;
    }
  }

  return { processed, failed };
}

// ---------------------------------------------------------------------------
// Envio real (plugável — substitua pelo provider de sua escolha)
// ---------------------------------------------------------------------------
async function sendNotification(log: Record<string, unknown>): Promise<void> {
  const type = log.type as NotifType;

  if (type === "EMAIL") {
    await sendEmail({
      to: log.recipient as string,
      subject: (log.subject as string) || "",
      template: log.template as NotifTemplate,
      bookingId: log.booking_id as string,
    });
    return;
  }

  if (type === "WHATSAPP") {
    await sendWhatsApp({
      to: log.recipient as string,
      template: log.template as NotifTemplate,
      bookingId: log.booking_id as string,
    });
    return;
  }

  throw new Error(`Canal não suportado: ${type}`);
}

// ---------------------------------------------------------------------------
// Email via Resend (troque pela sua integração)
// ---------------------------------------------------------------------------
async function sendEmail(opts: {
  to: string;
  subject: string;
  template: NotifTemplate;
  bookingId: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Em desenvolvimento sem a key, loga e retorna sem erro
    console.log(`[EMAIL STUB] To: ${opts.to} | Subject: ${opts.subject} | Template: ${opts.template}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "AgendaAí <noreply@agendaai.com>",
      to: opts.to,
      subject: opts.subject,
      html: buildEmailHtml(opts.template, opts.bookingId),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// WhatsApp via Twilio (troque pela sua integração)
// ---------------------------------------------------------------------------
async function sendWhatsApp(opts: {
  to: string;
  template: NotifTemplate;
  bookingId: string;
}): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!sid || !token || !from) {
    console.log(`[WHATSAPP STUB] To: ${opts.to} | Template: ${opts.template}`);
    return;
  }

  const body = buildWhatsAppMessage(opts.template);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${opts.to}`,
        Body: body,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio error: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Templates simples (substitua por templates HTML ricos)
// ---------------------------------------------------------------------------
function buildEmailHtml(template: NotifTemplate, bookingId: string, manageToken?: string): string {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const templates: Record<NotifTemplate, string> = {
    booking_confirmed: `<p>Seu agendamento foi confirmado! <a href="${baseUrl}/agendamento/${manageToken ?? bookingId}">Ver detalhes</a></p>`,
    booking_reminder_24h: `<p>Lembrete: você tem um agendamento amanhã.</p>`,
    booking_reminder_1h: `<p>Lembrete: seu agendamento começa em 1 hora.</p>`,
    booking_cancelled: `<p>Seu agendamento foi cancelado.</p>`,
    booking_rescheduled: `<p>Seu agendamento foi reagendado.</p>`,
    payment_received: `<p>Pagamento recebido com sucesso!</p>`,
    payment_failed: `<p>Houve um problema com seu pagamento.</p>`,
  };
  return templates[template] ?? "<p>Notificação AgendaAí</p>";
}

function buildWhatsAppMessage(template: NotifTemplate): string {
  const templates: Record<NotifTemplate, string> = {
    booking_confirmed: "✅ Seu agendamento foi confirmado!",
    booking_reminder_24h: "📅 Lembrete: você tem um agendamento amanhã.",
    booking_reminder_1h: "⏰ Seu agendamento começa em 1 hora!",
    booking_cancelled: "❌ Seu agendamento foi cancelado.",
    booking_rescheduled: "🔄 Seu agendamento foi reagendado.",
    payment_received: "💳 Pagamento confirmado!",
    payment_failed: "⚠️ Problema no pagamento.",
  };
  return templates[template] ?? "Notificação AgendaAí";
}
