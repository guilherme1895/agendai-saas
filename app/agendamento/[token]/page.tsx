"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Spinner, BookingStatusBadge } from "@/components/ui";

interface BookingDetail {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  cancel_reason?: string;
  meeting_url?: string;
  customer_notes?: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  duration_in_minutes: number;
  is_video_call: number;
  service_color: string;
  provider_name: string;
  provider_timezone: string;
  manage_token: string;
}

export default function ManagePage() {
  const { token } = useParams<{ token: string }>();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    fetch(`/api/public/manage/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setBooking(d.booking))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleCancel = async () => {
    setCancelError("");
    setCancelling(true);
    const res = await fetch(`/api/public/manage/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: cancelReason || null, cancelledBy: "customer" }),
    });
    const d = await res.json();
    setCancelling(false);
    if (!res.ok) {
      setCancelError(d.error);
      return;
    }
    setCancelled(true);
    setShowCancelForm(false);
    if (booking) setBooking({ ...booking, status: "cancelled_by_customer" });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound || !booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Agendamento não encontrado</h1>
        <p className="text-gray-500 text-sm">
          Este link pode ter expirado ou o agendamento não existe.
          Verifique o e-mail de confirmação.
        </p>
      </div>
    </div>
  );

  const startDate = new Date(booking.start_at);
  const isPast = startDate <= new Date();
  const isCancelled = booking.status.startsWith("cancelled");
  const canCancel = !isCancelled && !isPast && booking.status !== "completed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-gray-900">AgendaAí</span>
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-sm text-gray-500">Meu agendamento</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">

        {/* Cancelled banner */}
        {cancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-red-800">Agendamento cancelado</p>
              <p className="text-xs text-red-600">Você receberá um e-mail de confirmação do cancelamento.</p>
            </div>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Color bar + header */}
          <div className="h-2" style={{ backgroundColor: booking.service_color }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{booking.service_name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">com {booking.provider_name}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Data</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {format(startDate, "EEEE", { locale: ptBR })}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {format(startDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Horário</p>
                <p className="text-sm font-semibold text-gray-800">
                  {booking.start_at.slice(11, 16)} – {booking.end_at.slice(11, 16)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{booking.duration_in_minutes} minutos</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                <p className="text-sm font-semibold text-gray-800">{booking.customer_name}</p>
                <p className="text-xs text-gray-400 truncate">{booking.customer_email}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-0.5">Formato</p>
                <p className="text-sm font-semibold text-gray-800">
                  {booking.is_video_call ? "📹 Vídeo" : "🏢 Presencial"}
                </p>
              </div>
            </div>

            {/* Meet link */}
            {booking.meeting_url && !isCancelled && (
              <a href={booking.meeting_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors mb-4">
                📹 Entrar na videochamada
              </a>
            )}

            {/* Customer notes */}
            {booking.customer_notes && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-yellow-700 mb-1">Sua observação</p>
                <p className="text-sm text-gray-700">{booking.customer_notes}</p>
              </div>
            )}

            {/* Cancel reason */}
            {isCancelled && booking.cancel_reason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-red-600 mb-1">Motivo do cancelamento</p>
                <p className="text-sm text-gray-700">{booking.cancel_reason}</p>
              </div>
            )}

            {/* Booking ID */}
            <p className="text-xs text-gray-400 text-center">
              Código: <code className="font-mono">{booking.id}</code>
            </p>
          </div>
        </div>

        {/* Cancel section */}
        {canCancel && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {!showCancelForm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Precisa cancelar?</p>
                  <p className="text-xs text-gray-400 mt-0.5">O prestador será notificado por e-mail.</p>
                </div>
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="px-4 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Cancelar agendamento
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Confirmar cancelamento</p>
                  <p className="text-xs text-gray-500">
                    Tem certeza que deseja cancelar o agendamento de{" "}
                    <strong>{booking.service_name}</strong> em{" "}
                    {format(startDate, "d/MM", { locale: ptBR })} às {booking.start_at.slice(11, 16)}?
                  </p>
                </div>

                {cancelError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {cancelError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Motivo (opcional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    placeholder="Ex: Compromisso urgente..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 placeholder-gray-400 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {cancelling && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {cancelling ? "Cancelando..." : "Confirmar cancelamento"}
                  </button>
                  <button
                    onClick={() => { setShowCancelForm(false); setCancelReason(""); setCancelError(""); }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past booking note */}
        {isPast && !isCancelled && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-500">Este agendamento já ocorreu.</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pb-4">
          Dúvidas? Entre em contato com {booking.provider_name} diretamente.
        </p>
      </div>
    </div>
  );
}
