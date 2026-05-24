"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Badge, BookingStatusBadge, Modal, Input, Textarea, Select, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  notes?: string; tags?: string; source?: string;
  total_bookings: number; total_spent_cents: number;
  last_booking_at?: string; created_at: string;
}
interface Booking {
  id: string; start_at: string; status: string;
  service_name: string; service_color: string; paid_amount_cents: number;
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", tags: "", source: "" });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const r = await fetch(`/api/customers/${id}`);
    if (!r.ok) { router.push("/dashboard/clientes"); return; }
    const d = await r.json();
    setCustomer(d.customer);
    setBookings(d.bookings ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [id]);

  const openEdit = () => {
    if (!customer) return;
    let tags: string[] = [];
    try { tags = customer.tags ? JSON.parse(customer.tags) : []; } catch {}
    setForm({ name: customer.name, email: customer.email, phone: customer.phone ?? "", notes: customer.notes ?? "", tags: tags.join(", "), source: customer.source ?? "" });
    setEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/customers/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [] }),
    });
    setSaving(false); setEditModal(false); fetch_();
  };

  const handleDelete = async () => {
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    router.push("/dashboard/clientes");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  if (!customer) return null;

  let tags: string[] = [];
  try { tags = customer.tags ? JSON.parse(customer.tags) : []; } catch {}

  const sourceLabels: Record<string, string> = {
    organic: "Orgânico", referral: "Indicação", instagram: "Instagram", google: "Google", other: "Outro",
  };

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/clientes" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6">
        ← Voltar para clientes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-green-700">{customer.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-400 text-sm">{customer.email}</p>
            {customer.phone && <p className="text-gray-400 text-sm">{customer.phone}</p>}
            {tags.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {tags.map(t => <Badge key={t} color="purple">{t}</Badge>)}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>✏️ Editar</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(true)} className="text-red-400 hover:text-red-600">Excluir</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total de agendamentos", value: customer.total_bookings },
          { label: "Receita gerada", value: formatCurrency(customer.total_spent_cents) },
          { label: "Último agendamento", value: customer.last_booking_at ? format(new Date(customer.last_booking_at), "dd/MM/yyyy", { locale: ptBR }) : "—" },
          { label: "Cliente desde", value: format(new Date(customer.created_at), "MM/yyyy", { locale: ptBR }) },
        ].map(s => (
          <Card key={s.label} className="!p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Booking history */}
        <div className="col-span-2">
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Histórico de agendamentos</h2>
            </div>
            {bookings.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Nenhum agendamento ainda</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: b.service_color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{b.service_name}</p>
                      <p className="text-xs text-gray-400">{format(new Date(b.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    </div>
                    <BookingStatusBadge status={b.status} />
                    {b.paid_amount_cents > 0 && (
                      <span className="text-xs font-medium text-gray-600">{formatCurrency(b.paid_amount_cents)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações</h3>
            <div className="space-y-2.5">
              {customer.source && (
                <div>
                  <p className="text-xs text-gray-400">Origem</p>
                  <p className="text-sm text-gray-700">{sourceLabels[customer.source] ?? customer.source}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Cadastrado em</p>
                <p className="text-sm text-gray-700">{format(new Date(customer.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              </div>
            </div>
          </Card>
          {customer.notes && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notas internas</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar cliente" size="md">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="E-mail" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Tags" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="vip, retorno" />
          <Select label="Origem" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
            <option value="">—</option>
            <option value="organic">Orgânico</option><option value="referral">Indicação</option>
            <option value="instagram">Instagram</option><option value="google">Google</option><option value="other">Outro</option>
          </Select>
          <Textarea label="Notas internas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          <div className="flex gap-2 pt-2">
            <Button loading={saving} onClick={handleSave}>Salvar</Button>
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Excluir cliente" size="sm">
        <p className="text-sm text-gray-600 mb-5">Tem certeza? O histórico de agendamentos será mantido, mas o cliente será removido do CRM.</p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  );
}
