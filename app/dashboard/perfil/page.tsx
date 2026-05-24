"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, Card, Input, Textarea, Select, PageHeader } from "@/components/ui";
import { slugify } from "@/lib/utils";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
  { value: "America/New_York", label: "Nova York (GMT-5)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Mexico_City", label: "Cidade do México (GMT-6)" },
];

const NOTICE_OPTIONS = [
  { value: 0, label: "Sem aviso mínimo" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
  { value: 240, label: "4 horas" },
  { value: 480, label: "8 horas" },
  { value: 1440, label: "1 dia" },
  { value: 2880, label: "2 dias" },
];

const MAX_DAYS_OPTIONS = [
  { value: 7, label: "7 dias" }, { value: 14, label: "14 dias" },
  { value: 30, label: "30 dias" }, { value: 60, label: "60 dias" },
  { value: 90, label: "90 dias" }, { value: 180, label: "6 meses" },
  { value: 365, label: "1 ano" },
];

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "", slug: "", bio: "", phone: "", timezone: "America/Sao_Paulo",
    bookingPageTitle: "", minimumNotice: 60, maxDaysInAdvance: 60,
  });
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        slug: user.slug ?? "",
        bio: user.bio ?? "",
        phone: user.phone ?? "",
        timezone: user.timezone ?? "America/Sao_Paulo",
        bookingPageTitle: user.booking_page_title ?? "",
        minimumNotice: user.minimum_notice ?? 60,
        maxDaysInAdvance: user.max_days_in_advance ?? 60,
      });
      setSlugManual(true);
    }
  }, [user]);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (v: string) => {
    set("name", v);
    if (!slugManual) set("slug", slugify(v));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const r = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setError(d.error); return; }
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/agendar/${form.slug}`
    : `/agendar/${form.slug}`;

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="Meu Perfil" description="Configure as informações da sua página pública de agendamento" />

      {/* Preview card */}
      <Card className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-green-700">{form.name.charAt(0)?.toUpperCase() || "?"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{form.name || "Seu nome"}</p>
            {form.bookingPageTitle && <p className="text-sm text-gray-500">{form.bookingPageTitle}</p>}
            {form.bio && <p className="text-xs text-gray-400 mt-0.5 truncate">{form.bio}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-xs text-green-600 font-mono truncate">/agendar/{form.slug || "seu-slug"}</p>
              <button type="button" onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="text-xs text-gray-400 hover:text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                Copiar
              </button>
              <a href={`/agendar/${form.slug}`} target="_blank" rel="noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600">
                Abrir ↗
              </a>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Identidade */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Identidade</h2>
          <div className="space-y-4">
            <Input label="Nome completo *" value={form.name} onChange={e => handleNameChange(e.target.value)} required />
            <Input label="Link personalizado *" value={form.slug}
              prefix="agendaai.com/agendar/"
              onChange={e => { setSlugManual(true); set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")); }}
              helper="Apenas letras minúsculas, números e hífens." required />
            <Input label="Título da página de agendamento" value={form.bookingPageTitle}
              onChange={e => set("bookingPageTitle", e.target.value)}
              placeholder="Ex: Agende uma consulta comigo" />
            <Textarea label="Bio / Apresentação" value={form.bio}
              onChange={e => set("bio", e.target.value)} rows={3}
              placeholder="Descreva seus serviços ou especialidade para os clientes..." />
            <Input label="Telefone / WhatsApp" value={form.phone}
              onChange={e => set("phone", e.target.value)} placeholder="+55 11 99999-9999" />
          </div>
        </Card>

        {/* Fuso horário */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Localização e horário</h2>
          <div className="space-y-4">
            <Select label="Fuso horário *" value={form.timezone} onChange={e => set("timezone", e.target.value)}>
              {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </Select>
            <p className="text-xs text-gray-400 -mt-2">Todos os horários são calculados neste fuso. Os clientes verão os slots convertidos para o fuso deles.</p>
          </div>
        </Card>

        {/* Regras de agendamento */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Regras de agendamento</h2>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Antecedência mínima" value={String(form.minimumNotice)}
              onChange={e => set("minimumNotice", Number(e.target.value))}
              helper="Tempo mínimo antes de um agendamento">
              {NOTICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select label="Janela máxima" value={String(form.maxDaysInAdvance)}
              onChange={e => set("maxDaysInAdvance", Number(e.target.value))}
              helper="Quanto antes o cliente pode agendar">
              {MAX_DAYS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        </Card>

        {/* Plan badge */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Plano atual</p>
            <p className="text-xs text-gray-400 mt-0.5">{user?.plan === "pro" ? "Acesso completo a todos os recursos" : "Funcionalidades básicas"}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${user?.plan === "pro" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
            {user?.plan === "pro" ? "✨ Pro" : "Gratuito"}
          </div>
        </Card>

        <Button type="submit" loading={saving} className={saved ? "!bg-green-100 !text-green-700 !shadow-none" : ""}>
          {saved ? "✓ Perfil atualizado!" : "Salvar alterações"}
        </Button>
      </form>
    </div>
  );
}
