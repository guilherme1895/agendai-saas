"use client";
import { useEffect, useState, useCallback } from "react";
import { Button, Card, Toggle, Select, Badge, PageHeader, Spinner } from "@/components/ui";
import { DAY_NAMES } from "@/lib/utils";

interface Block { id?: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean; }
interface Service { id: string; name: string; color: string; }

const HOURS = Array.from({ length: 25 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const HALF_HOURS = Array.from({ length: 49 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function defaultBlocks(): Block[] {
  return [1, 2, 3, 4, 5].map(d => ({ dayOfWeek: d, startTime: "09:00", endTime: "18:00", isActive: true }));
}

export default function DisponibilidadePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>(defaultBlocks());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchServices = async () => {
    const r = await fetch("/api/services");
    const d = await r.json();
    setServices(d.services ?? []);
  };

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    const params = selectedServiceId ? `?serviceId=${selectedServiceId}` : "";
    const r = await fetch(`/api/availability${params}`);
    const d = await r.json();
    if (d.availability?.length > 0) {
      setBlocks(d.availability.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        dayOfWeek: a.day_of_week as number,
        startTime: a.start_time as string,
        endTime: a.end_time as string,
        isActive: a.is_active === 1,
      })));
    } else {
      setBlocks(defaultBlocks());
    }
    setLoading(false);
  }, [selectedServiceId]);

  useEffect(() => { fetchServices(); }, []);
  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const addBlock = (dayOfWeek: number) => {
    setBlocks(b => [...b, { dayOfWeek, startTime: "09:00", endTime: "18:00", isActive: true }]);
  };

  const removeBlock = (idx: number) => setBlocks(b => b.filter((_, i) => i !== idx));

  const updateBlock = (idx: number, patch: Partial<Block>) =>
    setBlocks(b => b.map((bl, i) => i === idx ? { ...bl, ...patch } : bl));

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: selectedServiceId, blocks }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const blocksByDay = DAY_NAMES.map((name, idx) => ({
    name, dayOfWeek: idx,
    blocks: blocks.map((b, i) => ({ ...b, _idx: i })).filter(b => b.dayOfWeek === idx),
  }));

  const activeCount = blocks.filter(b => b.isActive).length;
  const activeDays = new Set(blocks.filter(b => b.isActive).map(b => b.dayOfWeek)).size;

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Disponibilidade" description="Configure seus blocos de horário disponíveis para agendamento" />

      {/* Scope selector */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Configurar disponibilidade para:</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedServiceId(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${!selectedServiceId ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                🌐 Global (todos os serviços)
              </button>
              {services.map(s => (
                <button key={s.id} onClick={() => setSelectedServiceId(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${selectedServiceId === s.id ? "border-green-400 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-gray-900">{activeDays}</p>
            <p className="text-xs text-gray-400">dias ativos</p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3 mb-8">
          {blocksByDay.map(({ name, dayOfWeek, blocks: dayBlocks }) => {
            const hasBlocks = dayBlocks.length > 0;
            const isEnabled = hasBlocks && dayBlocks.some(b => b.isActive);
            return (
              <Card key={dayOfWeek} className={`transition-all ${isEnabled ? "border-green-200" : "border-gray-100"}`} padding={false}>
                <div className="p-4">
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Toggle checked={isEnabled} onChange={v => {
                      if (!v) {
                        if (hasBlocks) setBlocks(b => b.map((bl, i) => dayBlocks.find(db => db._idx === i) ? { ...bl, isActive: false } : bl));
                      } else {
                        if (hasBlocks) setBlocks(b => b.map((bl, i) => dayBlocks.find(db => db._idx === i) ? { ...bl, isActive: true } : bl));
                        else addBlock(dayOfWeek);
                      }
                    }} />
                    <span className={`text-sm font-semibold w-32 ${isEnabled ? "text-gray-900" : "text-gray-400"}`}>{name}</span>
                    {!isEnabled && <span className="text-xs text-gray-400 italic">Indisponível</span>}
                  </div>

                  {/* Blocks */}
                  {isEnabled && (
                    <div className="pl-[52px] space-y-2">
                      {dayBlocks.map(block => (
                        <div key={block._idx} className="flex items-center gap-2">
                          <select value={block.startTime} onChange={e => updateBlock(block._idx, { startTime: e.target.value })}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                            {HALF_HOURS.filter(h => h < block.endTime).map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <span className="text-gray-400 text-sm">até</span>
                          <select value={block.endTime} onChange={e => updateBlock(block._idx, { endTime: e.target.value })}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                            {HALF_HOURS.filter(h => h > block.startTime).map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          {dayBlocks.length > 1 && (
                            <button onClick={() => removeBlock(block._idx)}
                              className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors text-xs">✕</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addBlock(dayOfWeek)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 mt-1">
                        + Adicionar bloco
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button loading={saving} onClick={handleSave}
          className={saved ? "!bg-green-100 !text-green-700 !shadow-none" : ""}>
          {saved ? "✓ Salvo!" : "Salvar disponibilidade"}
        </Button>
        <p className="text-xs text-gray-400">{activeCount} bloco{activeCount !== 1 ? "s" : ""} configurado{activeCount !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}
