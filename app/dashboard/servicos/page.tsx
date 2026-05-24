"use client";
import { useEffect, useState, useCallback } from "react";
import { Button, Card, Badge, EmptyState, PageHeader, Modal, Input, Textarea, Select, Toggle, Spinner } from "@/components/ui";
import { slugify, formatCurrency } from "@/lib/utils";

interface Service {
  id: string; name: string; description?: string; slug: string; color: string;
  is_active: number; is_public: number; duration_in_minutes: number;
  buffer_time_before: number; buffer_time_after: number;
  price: number; currency: string; payment_required: number;
  is_video_call: number; video_call_provider?: string; custom_meeting_url?: string;
  max_participants: number; position: number;
}

const EMPTY: Partial<Service> & Record<string, unknown> = {
  name: "", description: "", slug: "", color: "#22c55e",
  is_active: 1, is_public: 1, duration_in_minutes: 60,
  buffer_time_before: 0, buffer_time_after: 0,
  price: 0, currency: "BRL", payment_required: 0,
  is_video_call: 0, video_call_provider: undefined, custom_meeting_url: "",
  max_participants: 1, position: 0,
};

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/services");
    const d = await r.json();
    setServices(d.services ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setSlugManual(false); setError(""); setModal(true); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ ...s }); setSlugManual(true); setError(""); setModal(true); };

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }));

  const handleNameChange = (v: string) => {
    set("name", v);
    if (!slugManual) set("slug", slugify(v));
  };

  const handleSave = async () => {
    setError(""); setSaving(true);
    const payload = {
      name: form.name, description: form.description || null, slug: form.slug,
      color: form.color, isActive: form.is_active === 1, isPublic: form.is_public === 1,
      durationInMinutes: Number(form.duration_in_minutes),
      bufferTimeBefore: Number(form.buffer_time_before),
      bufferTimeAfter: Number(form.buffer_time_after),
      price: Math.round(Number(form.price) * 100), currency: form.currency,
      paymentRequired: form.payment_required === 1,
      isVideoCall: form.is_video_call === 1,
      videoCallProvider: form.video_call_provider || null,
      customMeetingUrl: form.custom_meeting_url || null,
      maxParticipants: Number(form.max_participants), position: Number(form.position),
    };
    const url = editing ? `/api/services/${editing.id}` : "/api/services";
    const method = editing ? "PUT" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setError(d.error); return; }
    setModal(false);
    fetch_();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetch_();
  };

  const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];
  const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="p-8">
      <PageHeader title="Serviços" description="Configure os serviços que você oferece aos clientes"
        action={<Button onClick={openCreate}>+ Novo serviço</Button>} />

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : services.length === 0 ? (
        <Card><EmptyState icon="🛎️" title="Nenhum serviço cadastrado"
          description="Crie seu primeiro serviço para começar a receber agendamentos."
          action={<Button onClick={openCreate}>Criar serviço</Button>} /></Card>
      ) : (
        <div className="grid gap-4">
          {services.map(s => (
            <Card key={s.id} padding={false} className="overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    {s.is_active === 0 && <Badge color="gray">Inativo</Badge>}
                    {s.is_public === 0 && <Badge color="gray">Oculto</Badge>}
                    {s.is_video_call === 1 && <Badge color="blue">📹 Vídeo</Badge>}
                    {s.payment_required === 1 && <Badge color="green">💳 Pago</Badge>}
                  </div>
                  {s.description && <p className="text-sm text-gray-400 mt-0.5 truncate">{s.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>⏱ {s.duration_in_minutes}min</span>
                    {(s.buffer_time_before > 0 || s.buffer_time_after > 0) && (
                      <span>⏸ Buffer: {s.buffer_time_before}+{s.buffer_time_after}min</span>
                    )}
                    <span>💰 {s.price === 0 ? "Gratuito" : formatCurrency(s.price)}</span>
                    <span className="font-mono text-gray-400">/{s.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(s.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50">Excluir</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Editar serviço" : "Novo serviço"} size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Nome do serviço *" value={String(form.name ?? "")}
                onChange={e => handleNameChange(e.target.value)} placeholder="Ex: Consulta inicial" />
            </div>
            <div className="col-span-2">
              <Textarea label="Descrição" value={String(form.description ?? "")}
                onChange={e => set("description", e.target.value)} rows={2} placeholder="Breve descrição para o cliente..." />
            </div>
            <Input label="Slug (URL) *" value={String(form.slug ?? "")} prefix="/agendar/slug/"
              onChange={e => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }}
              helper="Identificador único na URL" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor</label>
              <div className="flex items-center gap-2">
                <input type="color" value={String(form.color ?? "#22c55e")} onChange={e => set("color", e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <span className="text-sm text-gray-500">Cor no calendário</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select label="Duração *" value={String(form.duration_in_minutes ?? 60)} onChange={e => set("duration_in_minutes", Number(e.target.value))}>
              {DURATIONS.map(d => <option key={d} value={d}>{d < 60 ? `${d}min` : `${d / 60}h${d % 60 ? `${d % 60}min` : ""}`}</option>)}
            </Select>
            <Select label="Buffer antes" value={String(form.buffer_time_before ?? 0)} onChange={e => set("buffer_time_before", Number(e.target.value))}>
              {BUFFERS.map(b => <option key={b} value={b}>{b === 0 ? "Nenhum" : `${b}min`}</option>)}
            </Select>
            <Select label="Buffer depois" value={String(form.buffer_time_after ?? 0)} onChange={e => set("buffer_time_after", Number(e.target.value))}>
              {BUFFERS.map(b => <option key={b} value={b}>{b === 0 ? "Nenhum" : `${b}min`}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Preço (R$)" type="number" min="0" step="0.01"
              value={String((Number(form.price ?? 0) / 100).toFixed(2))}
              onChange={e => set("price", Math.round(Number(e.target.value) * 100))} />
            <Select label="Moeda" value={String(form.currency ?? "BRL")} onChange={e => set("currency", e.target.value)}>
              <option value="BRL">BRL</option><option value="USD">USD</option><option value="EUR">EUR</option>
            </Select>
            <Input label="Máx. participantes" type="number" min="1"
              value={String(form.max_participants ?? 1)} onChange={e => set("max_participants", Number(e.target.value))} />
          </div>

          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
            <Toggle checked={form.is_video_call === 1} onChange={v => set("is_video_call", v ? 1 : 0)}
              label="É uma videochamada" description="Cria link de reunião automaticamente" />
            {form.is_video_call === 1 && (
              <div className="pl-14 space-y-3">
                <Select label="Provedor" value={String(form.video_call_provider ?? "")} onChange={e => set("video_call_provider", e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="google_meet">Google Meet (automático)</option>
                  <option value="zoom">Zoom</option>
                  <option value="custom">URL customizada</option>
                </Select>
                {form.video_call_provider === "custom" && (
                  <Input label="URL da reunião" value={String(form.custom_meeting_url ?? "")}
                    onChange={e => set("custom_meeting_url", e.target.value)} placeholder="https://zoom.us/j/..." />
                )}
              </div>
            )}
            <Toggle checked={form.payment_required === 1} onChange={v => set("payment_required", v ? 1 : 0)}
              label="Exige pagamento para confirmar" description="O agendamento só é confirmado após o pagamento" />
            <Toggle checked={form.is_public === 1} onChange={v => set("is_public", v ? 1 : 0)}
              label="Visível na página pública" />
            <Toggle checked={form.is_active === 1} onChange={v => set("is_active", v ? 1 : 0)}
              label="Serviço ativo" />
          </div>
        </div>

        <div className="flex gap-2 mt-5 pt-5 border-t border-gray-100">
          <Button loading={saving} onClick={handleSave}>{editing ? "Salvar alterações" : "Criar serviço"}</Button>
          <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Excluir serviço" size="sm">
        <p className="text-sm text-gray-600 mb-5">Esta ação é irreversível. Todos os agendamentos associados serão mantidos, mas o serviço não estará mais disponível.</p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  );
}
