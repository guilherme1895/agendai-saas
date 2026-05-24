"use client";
import { useEffect, useState } from "react";
import { Button, Card, Badge, PageHeader, Modal, Toggle, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

interface GCalStatus { connected: boolean; calendarEnabled: boolean; calendarId?: string; lastSyncAt?: string; }
interface StripeStatus { connected: boolean; accountId?: string; status?: string; dashboardUrl?: string; }

export default function IntegracoesPage() {
  const { user } = useAuth();
  const [gcal, setGcal] = useState<GCalStatus | null>(null);
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [loadingGcal, setLoadingGcal] = useState(true);
  const [loadingStripe, setLoadingStripe] = useState(true);
  const [gcalModal, setGcalModal] = useState(false);
  const [processingGcal, setProcessingGcal] = useState(false);
  const [processingStripe, setProcessingStripe] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState<"google" | null>(null);

  useEffect(() => {
    fetch("/api/integrations/google-calendar")
      .then(r => r.json()).then(d => setGcal(d)).finally(() => setLoadingGcal(false));
    fetch("/api/integrations/stripe")
      .then(r => r.json()).then(d => setStripe(d)).finally(() => setLoadingStripe(false));
  }, []);

  const handleGcalToggle = async (enabled: boolean, calendarId?: string) => {
    setProcessingGcal(true);
    await fetch("/api/integrations/google-calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, calendarId }),
    });
    const r = await fetch("/api/integrations/google-calendar");
    setGcal(await r.json());
    setProcessingGcal(false);
  };

  const handleDisconnectGoogle = async () => {
    setProcessingGcal(true);
    await fetch("/api/integrations/google-calendar", { method: "DELETE" });
    setGcal({ connected: false, calendarEnabled: false });
    setDisconnectConfirm(null);
    setProcessingGcal(false);
  };

  const handleStripeOnboard = async () => {
    setProcessingStripe(true);
    const r = await fetch("/api/integrations/stripe", { method: "POST" });
    const d = await r.json();
    setProcessingStripe(false);
    if (d.onboardingUrl) window.location.href = d.onboardingUrl;
  };

  const GOOGLE_OAUTH_URL = `/api/auth/google?callbackUrl=/dashboard/integracoes`;

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Integrações" description="Conecte ferramentas externas para automatizar seu fluxo de trabalho" />

      <div className="space-y-4">
        {/* Google Calendar */}
        <Card className="overflow-hidden !p-0">
          <div className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-2xl">📅</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                {loadingGcal ? <Spinner size="sm" /> : gcal?.connected ? (
                  <Badge color="green" dot>Conectado</Badge>
                ) : <Badge color="gray">Desconectado</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                Sincronize agendamentos com o Google Calendar. Crie eventos automaticamente e gere links do Google Meet para videochamadas.
              </p>

              {gcal?.connected && (
                <div className="mt-4 space-y-3 bg-gray-50 rounded-xl p-4">
                  <Toggle
                    checked={gcal.calendarEnabled}
                    onChange={v => handleGcalToggle(v, gcal.calendarId)}
                    label="Sincronizar novos agendamentos"
                    description="Cria automaticamente eventos no seu Google Calendar"
                    disabled={processingGcal}
                  />
                  {gcal.calendarEnabled && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">ID do calendário</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={gcal.calendarId ?? "primary"}
                          onBlur={e => handleGcalToggle(gcal.calendarEnabled, e.target.value)}
                          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                          placeholder="primary ou seu-email@gmail.com"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Use "primary" para o calendário principal ou o e-mail do calendário específico.</p>
                    </div>
                  )}
                  {gcal.lastSyncAt && (
                    <p className="text-xs text-gray-400">Última sinc.: {new Date(gcal.lastSyncAt).toLocaleString("pt-BR")}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col gap-2">
              {!gcal?.connected ? (
                <Button onClick={() => window.location.href = GOOGLE_OAUTH_URL} size="sm">
                  Conectar Google
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setDisconnectConfirm("google")}
                  className="text-red-400 hover:text-red-600">
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {gcal?.connected && (
            <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
              <span className="text-blue-500 text-sm">ℹ️</span>
              <p className="text-xs text-blue-700">Para videochamadas via Google Meet, ative a opção "É uma videochamada" no serviço e selecione "Google Meet" como provedor.</p>
            </div>
          )}
        </Card>

        {/* Stripe */}
        <Card className="overflow-hidden !p-0">
          <div className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-2xl">💳</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Stripe Payments</h3>
                {loadingStripe ? <Spinner size="sm" /> : stripe?.connected ? (
                  <Badge color={stripe.status === "active" ? "green" : "yellow"} dot>
                    {stripe.status === "active" ? "Ativo" : "Pendente verificação"}
                  </Badge>
                ) : <Badge color="gray">Desconectado</Badge>}
              </div>
              <p className="text-sm text-gray-500">
                Aceite pagamentos online no momento do agendamento. O Stripe cuida de toda a infraestrutura de cobrança e repasse.
              </p>

              {stripe?.connected && (
                <div className="mt-4 space-y-2">
                  {stripe.status !== "active" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                      <p className="text-xs text-yellow-700 font-medium mb-0.5">⚠️ Conta pendente</p>
                      <p className="text-xs text-yellow-600">Complete o processo de verificação no Stripe para começar a receber pagamentos.</p>
                    </div>
                  )}
                  {stripe.accountId && (
                    <p className="text-xs text-gray-400 font-mono">Conta: {stripe.accountId}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col gap-2">
              {!stripe?.connected ? (
                <Button onClick={handleStripeOnboard} loading={processingStripe} size="sm">
                  Conectar Stripe
                </Button>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {stripe.status !== "active" && (
                    <Button size="sm" loading={processingStripe} onClick={handleStripeOnboard}>
                      Retomar verificação
                    </Button>
                  )}
                  {stripe.dashboardUrl && (
                    <a href={stripe.dashboardUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="w-full">Ver dashboard →</Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {stripe?.connected && stripe.status === "active" && (
            <div className="px-5 py-3 bg-purple-50 border-t border-purple-100 flex items-center gap-2">
              <span className="text-purple-500 text-sm">✅</span>
              <p className="text-xs text-purple-700">Sua conta está ativa. Configure serviços pagos em <strong>Serviços → Editar → Preço</strong>.</p>
            </div>
          )}
        </Card>

        {/* Notificações / E-mail */}
        <Card className="overflow-hidden !p-0">
          <div className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0 text-2xl">✉️</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">E-mail (Resend)</h3>
                <Badge color={process.env.NEXT_PUBLIC_EMAIL_CONFIGURED === "true" ? "green" : "gray"} dot>
                  {process.env.NEXT_PUBLIC_EMAIL_CONFIGURED === "true" ? "Configurado" : "Configure no .env"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                Envio automático de confirmações, lembretes (24h e 1h antes) e cancelamentos para seus clientes.
              </p>
              <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-1">
                {["Confirmação de agendamento", "Lembrete 24h antes", "Lembrete 1h antes", "Notificação de cancelamento"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-green-500">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <a href="https://resend.com" target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">Criar conta →</Button>
              </a>
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">Configure <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">RESEND_API_KEY</code> e <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">EMAIL_FROM</code> no arquivo <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">.env</code></p>
          </div>
        </Card>

        {/* WhatsApp */}
        <Card className="overflow-hidden !p-0">
          <div className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-2xl">💬</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">WhatsApp (Twilio)</h3>
                <Badge color="gray">Configure no .env</Badge>
              </div>
              <p className="text-sm text-gray-500">
                Envie confirmações e lembretes via WhatsApp para clientes que forneceram número de telefone.
              </p>
            </div>
            <div className="flex-shrink-0">
              <a href="https://twilio.com/whatsapp" target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">Ver docs →</Button>
              </a>
            </div>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">Configure <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">TWILIO_ACCOUNT_SID</code>, <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">TWILIO_AUTH_TOKEN</code> e <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono">TWILIO_WHATSAPP_FROM</code></p>
          </div>
        </Card>
      </div>

      {/* Disconnect confirm */}
      <Modal open={disconnectConfirm === "google"} onClose={() => setDisconnectConfirm(null)} title="Desconectar Google" size="sm">
        <p className="text-sm text-gray-600 mb-5">Isso removerá os tokens de acesso. Agendamentos futuros não serão criados no Google Calendar. Agendamentos existentes não serão afetados.</p>
        <div className="flex gap-2">
          <Button variant="danger" loading={processingGcal} onClick={handleDisconnectGoogle}>Desconectar</Button>
          <Button variant="secondary" onClick={() => setDisconnectConfirm(null)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  );
}
