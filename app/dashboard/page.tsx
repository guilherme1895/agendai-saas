"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, Badge, BookingStatusBadge, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface Booking {
  id: string; client_name?: string; customer_name?: string; customer_email?: string;
  start_at: string; end_at: string; status: string;
  service_name?: string; service_color?: string; paid_amount_cents?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const currentMonth = format(new Date(), "yyyy-MM");
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetch(`/api/bookings?month=${currentMonth}`)
      .then(r => r.json())
      .then(d => setBookings(d.bookings ?? []))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const confirmed = bookings.filter(b => b.status === "confirmed" || b.status === "completed");
  const todayBookings = confirmed.filter(b => b.start_at.startsWith(today));
  const upcoming = confirmed
    .filter(b => b.start_at >= new Date().toISOString())
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .slice(0, 6);
  const revenue = bookings
    .filter(b => b.status !== "cancelled_by_provider" && b.status !== "cancelled_by_customer")
    .reduce((s, b) => s + (b.paid_amount_cents ?? 0), 0);

  const stats = [
    { label: "Agendamentos hoje", value: todayBookings.length, icon: "📅", color: "green" },
    { label: "Este mês", value: confirmed.length, icon: "📊", color: "blue" },
    { label: "Receita do mês", value: formatCurrency(revenue), icon: "💰", color: "emerald" },
    { label: "Próximos", value: upcoming.length, icon: "⏳", color: "purple" },
  ];

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/agendar/${user?.slug}` : "";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-gray-400 text-sm mt-1 capitalize">{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.label} className="!p-5">
            <div className="text-2xl mb-3">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Upcoming bookings */}
        <div className="col-span-3">
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Próximos agendamentos</h2>
              <Link href="/dashboard/agenda" className="text-xs text-green-600 font-medium hover:underline">Ver todos →</Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Spinner /></div>
            ) : upcoming.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm text-gray-400">Nenhum agendamento próximo</p>
                <Link href="/dashboard/disponibilidade" className="text-xs text-green-600 mt-2 inline-block hover:underline">Configure seus horários →</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcoming.map(b => {
                  const name = b.customer_name ?? b.client_name ?? "—";
                  const startTime = b.start_at.includes("T") ? b.start_at.slice(11, 16) : b.start_at;
                  const dateStr = b.start_at.slice(0, 10);
                  const isToday = dateStr === today;
                  return (
                    <Link key={b.id} href={`/dashboard/agenda`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: b.service_color ?? "#22c55e" }} />
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ backgroundColor: b.service_color ?? "#22c55e" }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-400 truncate">{b.service_name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700">{startTime}</p>
                        <p className="text-xs text-gray-400">{isToday ? "Hoje" : format(new Date(dateStr + "T12:00:00"), "dd/MM")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <div className="col-span-2 space-y-4">
          {/* Link card */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Meu link de agendamento</h3>
            <div className="bg-green-50 rounded-xl px-3 py-2.5 mb-3">
              <p className="text-xs text-gray-400">URL pública</p>
              <p className="text-xs text-green-700 font-mono truncate mt-0.5">/agendar/{user?.slug}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="flex-1 py-2 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Copiar link
              </button>
              <Link href={`/agendar/${user?.slug}`} target="_blank"
                className="flex-1 py-2 text-xs font-semibold text-center text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Abrir
              </Link>
            </div>
          </Card>

          {/* Quick nav */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Ações rápidas</h3>
            <div className="space-y-1">
              {[
                { href: "/dashboard/servicos", icon: "🛎️", label: "Gerenciar serviços", sub: "Preços, duração, buffer" },
                { href: "/dashboard/disponibilidade", icon: "⏰", label: "Disponibilidade", sub: "Dias e horários" },
                { href: "/dashboard/clientes", icon: "👥", label: "Ver clientes", sub: "CRM e histórico" },
                { href: "/dashboard/integracoes", icon: "🔗", label: "Integrações", sub: "Google Cal, Stripe" },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-green-50 group transition-colors">
                  <span className="text-lg w-6 text-center">{a.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-700 group-hover:text-green-700">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
