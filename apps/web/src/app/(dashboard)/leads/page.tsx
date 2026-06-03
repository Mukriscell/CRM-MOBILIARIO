"use client";
import { useState } from "react";
import { useLeads, LeadRow } from "@/features/leads/useLeads";

const SCORE_COLOR: Record<string, string> = { HOT: "text-urgent", WARM: "text-warming", COLD: "text-sky-400" };

function waitingBadge(minutes: number | null) {
  if (minutes === null) return <span className="text-zinc-500">—</span>;
  const color = minutes >= 5 ? "text-urgent" : "text-warming";
  return <span className={color}>{minutes} min</span>;
}

export default function LeadsPage() {
  const [unresponded, setUnresponded] = useState(false);
  const { data, isLoading, error } = useLeads({ unresponded });

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Bandeja de Leads</h1>
          <p className="text-sm text-zinc-400">¿A quién contacto ahora?</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={unresponded} onChange={(e) => setUnresponded(e.target.checked)} />
          Solo sin respuesta
        </label>
      </header>

      {isLoading && <p className="text-zinc-400">Cargando…</p>}
      {error && <p className="text-urgent">{(error as Error).message}</p>}

      {data && data.data.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
          No hay leads sin responder 🎉
        </p>
      )}

      {data && data.data.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Fuente</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Sin respuesta</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((lead: LeadRow) => (
                <tr key={lead.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className={`px-3 py-2 font-bold ${SCORE_COLOR[lead.scoreTier ?? ""] ?? "text-zinc-500"}`}>
                    {lead.scoreTier === "HOT" ? "🔥" : ""} {lead.scoreTier ?? "—"}
                  </td>
                  <td className="px-3 py-2">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-3 py-2 text-zinc-300">{lead.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{lead.source}</td>
                  <td className="px-3 py-2">{lead.status}</td>
                  <td className="px-3 py-2">{waitingBadge(lead.minutesWaiting)}</td>
                  <td className="px-3 py-2">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-emerald-600 px-2 py-1 text-xs hover:bg-emerald-500"
                      >
                        💬 WhatsApp
                      </a>
                    )}
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
