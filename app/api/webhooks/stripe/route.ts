import { NextResponse } from "next/server";
import { apiHandler, ok } from "@/lib/api";
import { db } from "@/lib/db";
import { constructWebhookEvent } from "@/lib/stripe";

// Stripe envia o body raw — NÃO pode passar pelo JSON parser do Next.js
export const POST = async (req: Request): Promise<Response> => {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = constructWebhookEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature inválida.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Pagamento confirmado
      case "payment_intent.succeeded": {
        const pi = event.data.object as { id: string; amount: number; charges?: { data: Array<{ id: string }> } };
        const chargeId = pi.charges?.data?.[0]?.id ?? null;

        await db.execute({
          sql: `UPDATE bookings SET
                  payment_status = 'paid',
                  status = 'confirmed',
                  paid_amount_cents = ?,
                  paid_at = datetime('now'),
                  stripe_charge_id = ?,
                  updated_at = datetime('now')
                WHERE stripe_payment_intent_id = ?`,
          args: [pi.amount, chargeId, pi.id],
        });
        break;
      }

      // Pagamento falhou
      case "payment_intent.payment_failed": {
        const pi = event.data.object as { id: string };
        await db.execute({
          sql: `UPDATE bookings SET
                  payment_status = 'unpaid',
                  updated_at = datetime('now')
                WHERE stripe_payment_intent_id = ?`,
          args: [pi.id],
        });
        break;
      }

      // Reembolso processado
      case "charge.refunded": {
        const charge = event.data.object as {
          id: string;
          amount_refunded: number;
          refunded: boolean;
        };
        const status = charge.refunded ? "refunded" : "partially_refunded";

        await db.execute({
          sql: `UPDATE bookings SET
                  payment_status = ?,
                  refunded_amount_cents = ?,
                  refunded_at = datetime('now'),
                  updated_at = datetime('now')
                WHERE stripe_charge_id = ?`,
          args: [status, charge.amount_refunded, charge.id],
        });
        break;
      }

      // Conta Connect ativada
      case "account.updated": {
        const account = event.data.object as {
          id: string;
          charges_enabled: boolean;
          payouts_enabled: boolean;
        };
        const accountStatus = account.charges_enabled && account.payouts_enabled
          ? "active"
          : "restricted";

        await db.execute({
          sql: `UPDATE users SET
                  stripe_account_status = ?,
                  updated_at = datetime('now')
                WHERE stripe_account_id = ?`,
          args: [accountStatus, account.id],
        });
        break;
      }

      default:
        // Eventos não tratados — ignora silenciosamente
        break;
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Erro ao processar ${event.type}:`, err);
    // Retorna 200 para evitar retentativas desnecessárias do Stripe
  }

  return NextResponse.json({ received: true });
};
