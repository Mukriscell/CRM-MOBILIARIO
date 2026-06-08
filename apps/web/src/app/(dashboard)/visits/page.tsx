"use client";
import { useState } from "react";
import { useVisits, useScheduleVisit, useUpdateVisitStatus, VisitRow, ScheduleVisitPayload } from "@/features/visits/useVisits";
import { useLeads } from "@/features/leads/useLeads";
import { useProperties } from "@/features/properties/useProperties";

const VISIT_STATUSES = [
  { value: "SCHEDULED", label: "Agendada" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "NO_SHOW", label: "No asistió" },
];

const STATUS_STYLE: Record<string, string> = {
  SCHEDULED: "bg-violet-900/50 text-violet-300 border border-violet-700/50",
  CONFIRMED: "bg-sky-900/50 text-sky-300 border border-sky-700/50",
  COMPLETED: "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50",
  CANCELLED: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  NO_SHOW: "bg-red-900/50 text-red-300 border border-red-700/50",
};

const DATE_FMT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function leadLabel(name: string | null, phone: string | null, id: string): string {
  return name || phone || id.slice(0, 8);
}

function AgendarVisitaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: leadsData } = useLeads({ limit: 200 });
  const { data: propsData } = useProperties();
  const scheduleVisit = useScheduleVisit();

  const [leadId, setLeadId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const leads = leadsData?.data ?? [];
  const properties = propsData?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId) return setError("Selecciona un lead.");
    if (!propertyId) return setError("Selecciona una propiedad.");
    if (!scheduledAt) return setError("Indica fecha y hora.");
    const when = new Date(scheduledAt);
    if (isNaN(when.getTime())) return setError("Fecha y hora inválidas.");
    if (when.getTime() <= Date.now()) return setError("La visita debe ser en el futuro.");

    setError(null);
    const payload: ScheduleVisitPayload = {
      leadId,
      propertyId,
      scheduledAt: when.toISOString(),
      ...(notes && { notes }),
    };
    try {
      await scheduleVisit.mutateAsync(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-bold">Agendar Visita</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Lead *</label>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={inputCls}>
              <option value="">Selecciona un lead…</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {leadLabel([l.firstName, l.lastName].filter(Boolean).join(" ") || null, l.phone, l.id)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Propiedad *</label>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={inputCls}>
              <option value="">Selecciona una propiedad…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.internalCode} — {p.address ?? p.commune ?? p.type}
                </option>
              ))}
            </select>
            {properties.length === 0 && (
              <p className="mt-1 text-xs text-amber-400">No hay propiedades. Crea una en la sección Propiedades.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Fecha y hora *</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ej: llevar planos, estacionamiento visitas" className={inputCls} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800">
              Cancelar
            </button>
            <button type="submit" disabled={scheduleVisit.isPending} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50">
              {scheduleVisit.isPending ? "Agendando…" : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VisitsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading, error, refetch } = useVisits();
  const updateStatus = useUpdateVisitStatus();

  return (
    <div>
      {showModal && <AgendarVisitaModal onClose={() => setShowModal(false)} onSuccess={() => refetch()} />}

      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Visitas</h1>
          <p className="text-sm text-zinc-400">Agenda de visitas a propiedades.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500">
          + Agendar Visita
        </button>
      </header>

      {isLoading && <p className="text-zinc-400">Cargando…</p>}
      {error && (
        <div className="rounded-xl border border-red-700/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-red-400">No se pudo cargar las visitas</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
          No hay visitas agendadas. Agenda la primera con “+ Agendar Visita”.
        </p>
      )}

      {data && data.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Propiedad</th>
                <th className="px-3 py-2">Corredor</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Cambiar a</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((v: VisitRow) => (
                <tr key={v.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-3 py-2 text-zinc-300">{DATE_FMT.format(new Date(v.scheduledAt))}</td>
                  <td className="px-3 py-2">{leadLabel(v.leadName, v.leadPhone, v.leadId)}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    <span className="font-mono text-zinc-300">{v.propertyCode ?? "—"}</span>
                    {v.propertyAddress ? ` · ${v.propertyAddress}` : ""}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{v.userName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${STATUS_STYLE[v.status] ?? ""}`}>
                      {VISIT_STATUSES.find((s) => s.value === v.status)?.label ?? v.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={v.status}
                      onChange={(e) => {
                        if (e.target.value !== v.status) updateStatus.mutate({ id: v.id, status: e.target.value });
                      }}
                      disabled={updateStatus.isPending}
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    >
                      {VISIT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
