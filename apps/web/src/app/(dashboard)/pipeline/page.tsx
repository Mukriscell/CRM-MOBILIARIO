"use client";
import { useState } from "react";
import Link from "next/link";
import { useLeads, useUpdateLeadStatus, LeadRow } from "@/features/leads/useLeads";

// Etapas del pipeline (enum LeadStatus, sin PERDIDO — esos se ven en Recovery).
const STAGES = [
  { key: "NUEVO", label: "Nuevo", accent: "border-t-zinc-500" },
  { key: "CONTACTADO", label: "Contactado", accent: "border-t-sky-600" },
  { key: "INTERESADO", label: "Interesado", accent: "border-t-indigo-500" },
  { key: "VISITA_AGENDADA", label: "Visita agendada", accent: "border-t-violet-500" },
  { key: "NEGOCIACION", label: "Negociación", accent: "border-t-amber-500" },
  { key: "RESERVA", label: "Reserva", accent: "border-t-orange-500" },
  { key: "VENTA_CERRADA", label: "Venta cerrada", accent: "border-t-emerald-500" },
] as const;

// Todas las opciones de movimiento (incluye PERDIDO para poder descartar desde el tablero).
const STATUS_OPTIONS: { value: string; label: string }[] = [
  ...STAGES.map((s) => ({ value: s.key, label: s.label })),
  { value: "PERDIDO", label: "Perdido" },
];

const SCORE_STYLE: Record<string, string> = {
  HOT: "bg-red-900/50 text-red-300 border border-red-700/50",
  WARM: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
  COLD: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

function leadName(lead: LeadRow): string {
  return [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.phone || lead.id.slice(0, 8);
}

export default function PipelinePage() {
  const { data, isLoading, error } = useLeads({ limit: 200 });
  const updateStatus = useUpdateLeadStatus();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const leads = data?.data ?? [];

  const move = (id: string, status: string, currentStatus: string) => {
    if (status !== currentStatus) updateStatus.mutate({ id, status });
  };

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold">🪜 Pipeline</h1>
        <p className="text-sm text-zinc-400">
          Arrastra los leads entre etapas (o usa el selector en cada tarjeta).
        </p>
      </header>

      {isLoading && <p className="text-sm text-zinc-400">Cargando…</p>}

      {error && (
        <div className="rounded-xl border border-urgent/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-urgent">No se pudo cargar el pipeline</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
        </div>
      )}

      {data && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const items = leads.filter((l) => l.status === stage.key);
            const isOver = dragOverStage === stage.key;
            return (
              <div
                key={stage.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.key);
                }}
                onDragLeave={() => setDragOverStage((s) => (s === stage.key ? null : s))}
                onDrop={() => {
                  if (draggingId) {
                    const lead = leads.find((l) => l.id === draggingId);
                    if (lead) move(lead.id, stage.key, lead.status);
                  }
                  setDraggingId(null);
                  setDragOverStage(null);
                }}
                className={`flex w-72 shrink-0 flex-col rounded-xl border border-t-4 ${stage.accent} bg-zinc-900/60 ${
                  isOver ? "border-zinc-500 bg-zinc-800/60" : "border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-semibold text-zinc-200">{stage.label}</span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{items.length}</span>
                </div>

                <div className="flex flex-col gap-2 px-2 pb-2">
                  {items.length === 0 && (
                    <p className="px-1 py-4 text-center text-xs text-zinc-600">Sin leads</p>
                  )}
                  {items.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverStage(null);
                      }}
                      className={`cursor-grab rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 active:cursor-grabbing ${
                        draggingId === lead.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-zinc-100 hover:underline">
                          {leadName(lead)}
                        </Link>
                        {lead.scoreTier && (
                          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${SCORE_STYLE[lead.scoreTier] ?? ""}`}>
                            {lead.scoreTier}
                          </span>
                        )}
                      </div>
                      {lead.phone && <div className="mb-2 text-xs text-zinc-500">{lead.phone}</div>}
                      <select
                        value={lead.status}
                        onChange={(e) => move(lead.id, e.target.value, lead.status)}
                        disabled={updateStatus.isPending}
                        className="w-full rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-500 disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            Mover a: {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
