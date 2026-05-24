/**
 * Stripe integration
 * - Cria PaymentIntent para cobrar o cliente no agendamento
 * - Cria conta Stripe Connect para o prestador receber
 * - Processa webhooks (payment_intent.succeeded, refunded, etc.)
 */

import Stripe from "stripe";

// Instância lazy (não quebra se a key não estiver configurada em dev)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY não configurada.");
    _stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// Cria PaymentIntent para um agendamento
// ---------------------------------------------------------------------------
export async function createPaymentIntent(opts: {
  amountCents: number;
  currency: string;
  providerStripeAccountId: string; // Stripe Connect
  bookingId: string;
  customerEmail: string;
  serviceName: string;
  applicationFeeCents?: number; // Comissão da plataforma (opcional)
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe();

  const intent = await stripe.paymentIntents.create(
    {
      amount: opts.amountCents,
      currency: opts.currency.toLowerCase(),
      receipt_email: opts.customerEmail,
      metadata: {
        booking_id: opts.bookingId,
        service_name: opts.serviceName,
      },
      ...(opts.applicationFeeCents
        ? { application_fee_amount: opts.applicationFeeCents }
        : {}),
    },
    opts.providerStripeAccountId
      ? { stripeAccount: opts.providerStripeAccountId }
      : {}
  );

  return {
    clientSecret: intent.client_secret!,
    paymentIntentId: intent.id,
  };
}

// ---------------------------------------------------------------------------
// Reembolsa um pagamento
// ---------------------------------------------------------------------------
export async function refundPayment(opts: {
  chargeId: string;
  amountCents?: number; // undefined = reembolso total
  providerStripeAccountId?: string;
}): Promise<void> {
  const stripe = getStripe();

  await stripe.refunds.create(
    {
      charge: opts.chargeId,
      ...(opts.amountCents ? { amount: opts.amountCents } : {}),
    },
    opts.providerStripeAccountId
      ? { stripeAccount: opts.providerStripeAccountId }
      : {}
  );
}

// ---------------------------------------------------------------------------
// Cria conta Stripe Connect para o prestador (onboarding)
// ---------------------------------------------------------------------------
export async function createConnectAccount(opts: {
  email: string;
  country?: string; // "BR" default
}): Promise<{ accountId: string; onboardingUrl: string }> {
  const stripe = getStripe();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const account = await stripe.accounts.create({
    type: "express",
    email: opts.email,
    country: opts.country ?? "BR",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${baseUrl}/dashboard/pagamentos?status=refresh`,
    return_url: `${baseUrl}/dashboard/pagamentos?status=success`,
    type: "account_onboarding",
  });

  return { accountId: account.id, onboardingUrl: link.url };
}

// ---------------------------------------------------------------------------
// Gera link para o prestador acessar o dashboard do Stripe Express
// ---------------------------------------------------------------------------
export async function getStripeDashboardLink(stripeAccountId: string): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accounts.createLoginLink(stripeAccountId);
  return link.url;
}

// ---------------------------------------------------------------------------
// Valida e constrói o evento do webhook
// ---------------------------------------------------------------------------
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
