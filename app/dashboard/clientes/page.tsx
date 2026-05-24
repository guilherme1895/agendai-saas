"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Badge, EmptyState, PageHeader, Modal, Input, Textarea, Select, Spinner } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  notes?: string; tags?: string; source?: string;
  total_bookings: number; total_spent_cents: number; last_booking_at?: string;
  created_at: string;
}

const EMPTY = { name: "", email: "", phone: "", notes: "", tags: "", source: "" };

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const LIMIT = 20;

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ q, page: String(page), limit: String(LIMIT) });
    const r = await fetch(`/api/customers?${p}`);
    const d = await r.json();
    setCustomers(d.customers ?? []);
    setTotal(d.pagination?.total ?? 0);
    setLoading(false);
  }, [q, page]);

  useEffect(() => { setPage(1); }, [q]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSave = async () => {
    setError(""); setSaving(true);
    const r = await fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [] }),
    });
    const d = await r.json();
    setSaving(false);
    if (!r.ok) { setError(d.error); return; }
    setModal(false); setForm(EMPTY); fetch_();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="p-8">
      <PageHeader title="Clientes" description={`${total} cliente${total !== 1 ? "s" : ""} no total`}
        action={<Button onClick={() => { setForm(EMPTY); setError(""); setModal(true); }}>+ Novo cliente</Button>} />

      {/* Search */}
      <div className="mb-5">
        <Input placeholder="Buscar por nome, e-mail ou telefone..." value={q}
          onChange={e => setQ(e.target.value)} className="max-w-md" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : customers.length === 0 ? (
        <Card><EmptyState icon="👥" title="Nenhum cliente encontrado"
          description={q ? "Tente outros termos de busca." : "Seus clientes aparecerão aqui após o primeiro agendamento."}
          action={!q ? <Button onClick={() => setModal(true)}>Adicionar manualmente</Button> : undefined} /></Card>
      ) : (
        <>
          <Card padding={false} className="overflow-hidden mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Cliente", "Contato", "Agendamentos", "Receita total", "Último agend.", ""].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => {
                  let tags: string[] = [];
                  try { tags = c.tags ? JSON.parse(c.tags) : []; } catch { tags = []; }
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-gray-500">{c.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                            {tags.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {tags.slice(0, 2).map(t => <Badge key={t} color="purple" className="!py-0 !text-xs">{t}</Badge>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-700">{c.email}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">{c.total_bookings}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.total_spent_cents)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-500">
                          {c.last_booking_at ? format(new Date(c.last_booking_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/dashboard/clientes/${c.id}`}
                          className="text-xs font-medium text-green-600 hover:underline">Ver →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Próximo ›</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Novo cliente" size="md">
        <div className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <Input label="Nome completo *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="E-mail *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input label="Telefone / WhatsApp" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 11 99999-9999" />
          <Input label="Tags (separadas por vírgula)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="vip, retorno, indicação" />
          <Select label="Origem" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
            <option value="">Selecione...</option>
            <option value="organic">Orgânico</option>
            <option value="referral">Indicação</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="other">Outro</option>
          </Select>
          <Textarea label="Notas internas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Informações privadas sobre o cliente..." />
          <div className="flex gap-2 pt-2">
            <Button loading={saving} onClick={handleSave}>Salvar cliente</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
