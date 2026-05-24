"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

interface Provider { name: string; bio?: string | null; slug: string; booking_page_title?: string | null; }
interface Service {
  id: string; name: string; description?: string; slug: string; color: string;
  duration_in_minutes: number; price: number; currency: string;
  payment_required: number; is_video_call: number;
}
interface FreeSlot { startTime: string; endTime: string; }

type Step = "service" | "date" | "slot" | "form" | "success";

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providerLoading, setProviderLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<FreeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [successData, setSuccessData] = useState<{ bookingId: string; meetingUrl?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/public/${slug}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setProvider(d.provider); setServices(d.services ?? []); })
      .catch(() => setNotFound(true))
      .finally(() => setProviderLoading(false));
  }, [slug]);

  const handleSelectService = async (svc: Service) => {
    setSelectedService(svc);
    setStep("date");
    setDatesLoading(true);
    const r = await fetch(`/api/public/${slug}/slots?serviceId=${svc.id}`);
    const d = await r.json();
    setAvailableDates(d.availableDates ?? []);
    setDatesLoading(false);
  };

  const handleSelectDate = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotsLoading(true);
    setStep("slot");
    const r = await fetch(`/api/public/${slug}/slots?serviceId=${selectedService!.id}&date=${date}`);
    const d = await r.json();
    setSlots(d.slots ?? []);
    setSlotsLoading(false);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(""); setBooking(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const r = await fetch(`/api/public/${slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService!.id,
        date: selectedDate,
        startTime: selectedSlot!.startTime,
        customerName: clientName,
        customerEmail: clientEmail,
        customerPhone: clientPhone || null,
        customerTimezone: tz,
        customerNotes: clientNotes || null,
      }),
    });
    const d = await r.json();
    setBooking(false);
    if (!r.ok) { setBookingError(d.error); return; }
    setSuccessData({ bookingId: d.bookingId, meetingUrl: d.meetingUrl });
    setStep("success");
  };

  const reset = () => {
    setStep("service"); setSelectedService(null); setSelectedDate(null);
    setSelectedSlot(null); setClientName(""); setClientEmail("");
    setClientPhone(""); setClientNotes(""); setBookingError(""); setSuccessData(null);
  };

  // ─── Loading / Not found ──────────────────────────────────────────────────
  if (providerLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
  if (notFound || !provider) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
        <p className="text-gray-500 text-sm">Este link de agendamento não existe ou foi desativado.</p>
      </div>
    </div>
  );

  // ─── Calendário ───────────────────────────────────────────────────────────
  const today = startOfDay(new Date());
  const calDays = Array.from({ length: 42 }, (_, i) => addDays(today, i));

  const STEP_LABELS = ["Serviço", "Data", "Horário", "Dados"];
  const STEP_KEYS: Step[] = ["service", "date", "slot", "form"];
  const stepIdx = STEP_KEYS.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-bold text-xl">{provider.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{provider.name}</h1>
            {(provider.booking_page_title || provider.bio) && (
              <p className="text-xs text-gray-500 truncate">{provider.booking_page_title || provider.bio}</p>
            )}
          </div>
          {selectedService && step !== "service" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium flex-shrink-0" style={{ borderColor: selectedService.color, color: selectedService.color, backgroundColor: `${selectedService.color}15` }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedService.color }} />
              {selectedService.name}
            </div>
          )}
        </div>

        {/* Step indicator */}
        {step !== "success" && (
          <div className="max-w-xl mx-auto px-4 pb-3">
            <div className="flex items-center gap-1">
              {STEP_LABELS.map((label, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={label} className="flex items-center gap-1">
                    {i > 0 && <div className={`h-px flex-1 w-8 ${done ? "bg-green-400" : "bg-gray-200"}`} />}
                    <div className={`flex items-center gap-1.5 ${active ? "" : done ? "opacity-70" : "opacity-40"}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-green-500 text-white" : active ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${active ? "text-gray-800" : "text-gray-400"}`}>{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">

        {/* ── STEP: service ────────────────────────────────────────────────── */}
        {step === "service" && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Escolha um serviço</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🛎️</div>
                <p>Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(svc => (
                  <button key={svc.id} onClick={() => handleSelectService(svc)}
                    className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-green-300 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-3 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{svc.name}</h3>
                          <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                            {svc.price === 0 ? "Grátis" : formatCurrency(svc.price, svc.currency)}
                          </span>
                        </div>
                        {svc.description && <p className="text-sm text-gray-500 mt-0.5">{svc.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>⏱ {svc.duration_in_minutes}min</span>
                          {svc.is_video_call === 1 && <span>📹 Videochamada</span>}
                          {svc.payment_required === 1 && <span>💳 Pagamento antecipado</span>}
                        </div>
                      </div>
                      <span className="text-gray-300 group-hover:text-green-400 transition-colors text-lg flex-shrink-0">›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: date ───────────────────────────────────────────────────── */}
        {step === "date" && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep("service")} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
              <h2 className="font-semibold text-gray-900">Escolha uma data</h2>
            </div>

            {datesLoading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : availableDates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">😔</div>
                <p className="text-gray-500 text-sm">Nenhuma data disponível nos próximos dias.</p>
                <button onClick={() => setStep("service")} className="text-green-600 text-sm font-medium mt-3 hover:underline">
                  Escolher outro serviço
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                {/* First row spacer */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Offset for first day */}
                  {Array.from({ length: today.getDay() }, (_, i) => <div key={`empty-${i}`} />)}
                  {calDays.map(date => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isAvail = availableDates.includes(dateStr);
                    const isTodayDate = isToday(date);
                    const isPast = isBefore(date, today) && !isTodayDate;
                    const isSelected = dateStr === selectedDate;
                    return (
                      <button key={dateStr}
                        disabled={!isAvail || isPast}
                        onClick={() => handleSelectDate(dateStr)}
                        className={`relative aspect-square rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center
                          ${isSelected ? "bg-green-500 text-white shadow-lg shadow-green-200" : ""}
                          ${!isSelected && isAvail && !isPast ? "hover:bg-green-50 hover:text-green-700 text-gray-700" : ""}
                          ${!isAvail || isPast ? "text-gray-200 cursor-not-allowed" : "cursor-pointer"}
                          ${isTodayDate && !isSelected ? "ring-2 ring-green-300" : ""}
                        `}>
                        {format(date, "d")}
                        {isAvail && !isPast && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: slot ───────────────────────────────────────────────────── */}
        {step === "slot" && selectedDate && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep("date")} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
              <div>
                <h2 className="font-semibold text-gray-900">Escolha um horário</h2>
                <p className="text-xs text-gray-400 capitalize">{format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
              </div>
            </div>

            {slotsLoading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">😔</div>
                <p className="text-gray-500 text-sm">Nenhum horário disponível neste dia.</p>
                <button onClick={() => setStep("date")} className="text-green-600 text-sm font-medium mt-3 hover:underline">
                  Escolher outra data
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button key={slot.startTime} onClick={() => { setSelectedSlot(slot); setStep("form"); }}
                      className="py-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 text-sm font-semibold text-gray-700 hover:text-green-700 transition-all">
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: form ───────────────────────────────────────────────────── */}
        {step === "form" && selectedDate && selectedSlot && selectedService && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                style={{ backgroundColor: selectedService.color }}>
                {selectedService.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{selectedService.name}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  {format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })} · {selectedSlot.startTime}
                </p>
                {selectedService.price > 0 && (
                  <p className="text-xs font-semibold text-green-600 mt-1">{formatCurrency(selectedService.price, selectedService.currency)}</p>
                )}
              </div>
              <button onClick={() => setStep("slot")} className="text-xs text-green-600 hover:underline flex-shrink-0">Alterar</button>
            </div>

            {/* Form */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Seus dados</h2>
              <form onSubmit={handleBook} className="space-y-4">
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{bookingError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
                  <input required value={clientName} onChange={e => setClientName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
                  <input required type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp (opcional)</label>
                  <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações (opcional)</label>
                  <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={2}
                    placeholder="Alguma informação para o prestador..."
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400 resize-none" />
                </div>
                <Button type="submit" loading={booking} className="w-full !py-3 !text-base">
                  {selectedService.payment_required ? "Prosseguir para pagamento →" : "Confirmar agendamento"}
                </Button>
                <p className="text-xs text-gray-400 text-center">Você receberá uma confirmação por e-mail.</p>
              </form>
            </div>
          </div>
        )}

        {/* ── STEP: success ────────────────────────────────────────────────── */}
        {step === "success" && selectedDate && selectedSlot && selectedService && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Agendado!</h2>
            <p className="text-gray-500 text-sm mb-6">Uma confirmação foi enviada para <strong>{clientEmail}</strong></p>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-left space-y-3 mb-6">
              {[
                { icon: "🛎️", label: "Serviço", value: selectedService.name },
                { icon: "📅", label: "Data", value: format(new Date(selectedDate + "T12:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) },
                { icon: "⏰", label: "Horário", value: `${selectedSlot.startTime} – ${selectedSlot.endTime}` },
                { icon: "👤", label: "Com", value: provider!.name },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {successData?.meetingUrl && (
              <a href={successData.meetingUrl} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                📹 Entrar na videochamada
              </a>
            )}

            <p className="text-xs text-gray-400 mb-4">Código: <code className="font-mono">{successData?.bookingId}</code></p>

            <button onClick={reset} className="text-sm text-green-600 font-medium hover:underline">
              Fazer outro agendamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
