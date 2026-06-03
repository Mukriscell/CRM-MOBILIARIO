"use client";
import { useState } from "react";
import Link from "next/link";
import { useLeads, LeadRow } from "@/features/leads/useLeads";

const SCORE_STYLE: Record<string, string> = {
  HOT: "bg-red-900/50 text-red-300 border border-red-700/50",
  WARM: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
  COLD: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

function ScoreBadge({ tier }: { tier: string | null }) {
  if (!tier) return <span className="text-zinc-600 text-xs">—</span>;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${SCORE_STYLE[tier] ?? ""}`}>
      {tier}
    </span>
  );
}

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
      {error && (
        <div className="rounded-xl border border-urgent/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-urgent">No se pudo cargar los leads</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
          <p className="mt-2 text-zinc-500 text-xs">Verifica que la API esté corriendo en <code>localhost:4000</code>.</p>
        </div>
      )}

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
                  <td className="px-3 py-2">
                    <ScoreBadge tier={lead.scoreTier} />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{lead.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{lead.source}</td>
                  <td className="px-3 py-2">{lead.status}</td>
                  <td className="px-3 py-2">{waitingBadge(lead.minutesWaiting)}</td>
                  <td className="px-3 py-2 flex gap-2">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-emerald-600 px-2 py-1 text-xs hover:bg-emerald-500"
                      >
                        WhatsApp
                      </a>
                    )}
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded bg-zinc-700 px-2 py-1 text-xs hover:bg-zinc-600"
                    >
                      Ver score
                    </Link>
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
