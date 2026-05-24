"use client";
import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, Button, Badge, BookingStatusBadge, EmptyState, PageHeader, Modal, Textarea, Spinner } from "@/components/ui";

interface Booking {
  id: string; customer_name: string; customer_email: string; customer_phone?: string;
  start_at: string; end_at: string; status: string; payment_status: string;
  service_name: string; service_color: string; duration_in_minutes: number;
  is_video_call: number; meeting_url?: string;
  customer_notes?: string; internal_notes?: string;
  paid_amount_cents: number; cancel_reason?: string;
}

type FilterStatus = "all" | "confirmed" | "pending_payment" | "completed" | "cancelled_by_provider" | "cancelled_by_customer" | "no_show";

export default function AgendaPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: selectedMonth });
    if (filter !== "all") params.set("status", filter);
    const res = await fetch(`/api/bookings?${params}`);
    const d = await res.json();
    setBookings(d.bookings ?? []);
    setLoading(false);
  }, [selectedMonth, filter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async () => {
    if (!selected) return;
    setProcessing(true);
    await fetch(`/api/bookings/${selected.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason, cancelledBy: "provider" }),
    });
    setProcessing(false);
    setCancelModal(false);
    setSelected(null);
    setCancelReason("");
    fetchBookings();
  };

  const handleStatusChange = async (id: string, status: string) => {
    setProcessing(true);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProcessing(false);
    fetchBookings();
  };

  const prevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(format(new Date(y, m - 2, 1), "yyyy-MM"));
  };
  const nextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(format(new Date(y, m, 1), "yyyy-MM"));
  };

  // Group by date
  const grouped = bookings.reduce((acc, b) => {
    const date = b.start_at.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(b);
    return acc;
  }, {} as Record<string, Booking[]>);
  const sortedDates = Object.keys(grouped).sort();

  const FILTERS: { value: FilterStatus; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "confirmed", label: "Confirmados" },
    { value: "pending_payment", label: "Aguard. pagto." },
    { value: "completed", label: "Concluídos" },
    { value: "no_show", label: "Não compareceu" },
    { value: "cancelled_by_provider", label: "Cancelados" },
  ];

  return (
    <div className="p-8">
      <PageHeader title="Agenda" description="Gerencie todos os seus agendamentos" />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500">‹</button>
          <span className="text-sm font-medium text-gray-700 capitalize w-36 text-center">
            {format(new Date(selectedMonth + "-15"), "MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500">›</button>
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? "bg-green-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-sm text-gray-400">{bookings.length} resultado{bookings.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : sortedDates.length === 0 ? (
        <Card><EmptyState icon="📭" title="Nenhum agendamento" description="Não há agendamentos neste período com o filtro selecionado." /></Card>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => {
            const dateObj = parseISO(date + "T12:00:00");
            const isToday = date === today;
            const isPast = date < today;
            return (
              <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 ${isToday ? "bg-green-50" : isPast ? "bg-gray-50" : ""}`}>
                  <span className={`w-2 h-2 rounded-full ${isToday ? "bg-green-500" : isPast ? "bg-gray-300" : "bg-blue-400"}`} />
                  <span className={`text-sm font-semibold capitalize ${isToday ? "text-green-700" : "text-gray-700"}`}>
                    {format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                  {isToday && <span className="ml-1 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Hoje</span>}
                  <span className="ml-auto text-xs text-gray-400">{grouped[date].length} agendamento{grouped[date].length !== 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {grouped[date].sort((a, b) => a.start_at.localeCompare(b.start_at)).map(b => {
                    const startTime = b.start_at.slice(11, 16);
                    const endTime = b.end_at.slice(11, 16);
                    const isCancelled = b.status.startsWith("cancelled");
                    return (
                      <div key={b.id}
                        onClick={() => setSelected(b)}
                        className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer ${isCancelled ? "opacity-50" : ""}`}>
                        {/* Color bar */}
                        <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: b.service_color }} />
                        {/* Time */}
                        <div className="w-16 flex-shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-800">{startTime}</p>
                          <p className="text-xs text-gray-400">{endTime}</p>
                        </div>
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                          style={{ backgroundColor: b.service_color }}>
                          {b.customer_name.charAt(0).toUpperCase()}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{b.customer_name}</p>
                          <p className="text-xs text-gray-400">{b.service_name} · {b.duration_in_minutes}min</p>
                        </div>
                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {b.is_video_call === 1 && <span className="text-xs">📹</span>}
                          {b.meeting_url && <span title="Link de reunião disponível" className="text-xs">🔗</span>}
                          <BookingStatusBadge status={b.status} />
                        </div>
                        {/* Quick actions */}
                        {!isCancelled && (
                          <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            {b.status === "confirmed" && (
                              <>
                                <button onClick={() => handleStatusChange(b.id, "completed")}
                                  className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  Concluir
                                </button>
                                <button onClick={() => { setSelected(b); setCancelModal(true); }}
                                  className="px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  Cancelar
                                </button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <button onClick={() => handleStatusChange(b.id, "no_show")}
                                className="px-2.5 py-1 text-xs font-medium text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                No-show
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && !cancelModal && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do agendamento" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: selected.service_color }}>
                {selected.customer_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.customer_name}</p>
                <p className="text-sm text-gray-400">{selected.customer_email}</p>
                {selected.customer_phone && <p className="text-sm text-gray-400">{selected.customer_phone}</p>}
              </div>
              <div className="ml-auto"><BookingStatusBadge status={selected.status} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Serviço", value: selected.service_name },
                { label: "Duração", value: `${selected.duration_in_minutes} min` },
                { label: "Início", value: `${selected.start_at.slice(0, 10)} às ${selected.start_at.slice(11, 16)}` },
                { label: "Fim", value: selected.end_at.slice(11, 16) },
                { label: "Pagamento", value: selected.payment_status === "paid" ? `Pago — ${selected.paid_amount_cents / 100}` : "Não pago" },
                { label: "Videoconferência", value: selected.is_video_call ? "Sim" : "Não" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {selected.meeting_url && (
              <a href={selected.meeting_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700 font-medium hover:bg-blue-100 transition-colors">
                📹 Entrar na videochamada →
              </a>
            )}
            {selected.customer_notes && (
              <div className="p-3 bg-yellow-50 rounded-xl">
                <p className="text-xs text-yellow-700 font-medium mb-1">Observações do cliente</p>
                <p className="text-sm text-gray-700">{selected.customer_notes}</p>
              </div>
            )}
            {selected.cancel_reason && (
              <div className="p-3 bg-red-50 rounded-xl">
                <p className="text-xs text-red-600 font-medium mb-1">Motivo do cancelamento</p>
                <p className="text-sm text-gray-700">{selected.cancel_reason}</p>
              </div>
            )}

            {!selected.status.startsWith("cancelled") && selected.status !== "completed" && (
              <div className="flex gap-2 pt-2">
                <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>Cancelar agendamento</Button>
                {selected.status === "confirmed" && (
                  <Button variant="secondary" size="sm" loading={processing} onClick={() => { handleStatusChange(selected.id, "completed"); setSelected(null); }}>
                    Marcar como concluído
                  </Button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      <Modal open={cancelModal} onClose={() => { setCancelModal(false); setCancelReason(""); }} title="Cancelar agendamento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Tem certeza que deseja cancelar o agendamento de <strong>{selected?.customer_name}</strong>? O cliente será notificado por e-mail.</p>
          <Textarea label="Motivo do cancelamento (opcional)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Ex: Agenda indisponível nesta data..." />
          <div className="flex gap-2">
            <Button variant="danger" loading={processing} onClick={handleCancel}>Confirmar cancelamento</Button>
            <Button variant="secondary" onClick={() => { setCancelModal(false); setCancelReason(""); }}>Voltar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
