"use client";
import { useEffect, useState } from "react";
import { Card, Badge, PageHeader, Button, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string; customer_name: string; service_name: string;
  start_at: string; payment_status: string; paid_amount_cents: number;
  refunded_amount_cents: number; status: string;
  stripe_payment_intent_id?: string;
}

type PayFilter = "all" | "paid" | "unpaid" | "refunded";

export default function PagamentosPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PayFilter>("all");
  const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; status?: string; dashboardUrl?: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    fetch("/api/integrations/stripe").then(r => r.json()).then(d => setStripeStatus(d));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/bookings?month=${selectedMonth}`)
      .then(r => r.json())
      .then(d => setBookings(d.bookings ?? []))
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const paid = bookings.filter(b => b.payment_status === "paid");
  const pending = bookings.filter(b => b.payment_status === "unpaid" && b.status === "confirmed");
  const refunded = bookings.filter(b => b.payment_status === "refunded" || b.payment_status === "partially_refunded");

  const totalRevenue = paid.reduce((s, b) => s + b.paid_amount_cents, 0);
  const totalRefunded = refunded.reduce((s, b) => s + b.refunded_amount_cents, 0);
  const pendingAmount = pending.reduce((s, b) => s + 0, 0);

  const filtered = bookings.filter(b => {
    if (filter === "all") return b.paid_amount_cents > 0 || b.payment_status !== "unpaid";
    if (filter === "paid") return b.payment_status === "paid";
    if (filter === "unpaid") return b.payment_status === "unpaid";
    if (filter === "refunded") return b.payment_status === "refunded" || b.payment_status === "partially_refunded";
    return true;
  });

  const prevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(format(new Date(y, m - 2, 1), "yyyy-MM"));
  };
  const nextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(format(new Date(y, m, 1), "yyyy-MM"));
  };

  const payStatusColor = (s: string) => {
    if (s === "paid") return "green";
    if (s === "refunded" || s === "partially_refunded") return "orange";
    return "gray";
  };
  const payStatusLabel = (s: string) => {
    if (s === "paid") return "Pago";
    if (s === "refunded") return "Reembolsado";
    if (s === "partially_refunded") return "Parcial";
    return "Não pago";
  };

  return (
    <div className="p-8">
      <PageHeader title="Pagamentos" description="Controle financeiro dos seus agendamentos" />

      {/* Stripe banner */}
      {stripeStatus && !stripeStatus.connected && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-4">
          <span className="text-2xl">💳</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900">Conecte o Stripe para aceitar pagamentos</p>
            <p className="text-xs text-purple-600 mt-0.5">Configure serviços pagos e receba diretamente na sua conta bancária.</p>
          </div>
          <Button size="sm" onClick={() => window.location.href = "/dashboard/integracoes"}>Configurar →</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="!p-5">
          <p className="text-xs text-gray-400 mb-1">Receita do mês</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1">{paid.length} pagamento{paid.length !== 1 ? "s" : ""} confirmado{paid.length !== 1 ? "s" : ""}</p>
        </Card>
        <Card className="!p-5">
          <p className="text-xs text-gray-400 mb-1">Reembolsado</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalRefunded)}</p>
          <p className="text-xs text-gray-400 mt-1">{refunded.length} reembolso{refunded.length !== 1 ? "s" : ""}</p>
        </Card>
        <Card className="!p-5">
          <p className="text-xs text-gray-400 mb-1">Líquido estimado</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue - totalRefunded)}</p>
          <p className="text-xs text-gray-400 mt-1">Antes das taxas do Stripe</p>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500">‹</button>
          <span className="text-sm font-medium text-gray-700 capitalize w-36 text-center">
            {format(new Date(selectedMonth + "-15"), "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500">›</button>
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {(["all", "paid", "unpaid", "refunded"] as PayFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-green-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {f === "all" ? "Todos" : f === "paid" ? "Pagos" : f === "unpaid" ? "Pendentes" : "Reembolsados"}
            </button>
          ))}
        </div>

        {stripeStatus?.dashboardUrl && (
          <a href={stripeStatus.dashboardUrl} target="_blank" rel="noreferrer" className="ml-auto">
            <Button variant="outline" size="sm">Ver no Stripe →</Button>
          </a>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-gray-500 text-sm">Nenhuma transação neste período</p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Cliente", "Serviço", "Data", "Valor", "Status pagto.", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{b.customer_name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600">{b.service_name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-600">{format(new Date(b.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(b.paid_amount_cents)}</p>
                    {b.refunded_amount_cents > 0 && (
                      <p className="text-xs text-orange-500">-{formatCurrency(b.refunded_amount_cents)} reemb.</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge color={payStatusColor(b.payment_status) as "green" | "orange" | "gray"} dot>
                      {payStatusLabel(b.payment_status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {b.stripe_payment_intent_id && stripeStatus?.dashboardUrl && (
                      <a href={`https://dashboard.stripe.com/payments/${b.stripe_payment_intent_id}`} target="_blank" rel="noreferrer"
                        className="text-xs text-purple-600 hover:underline">Stripe →</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
