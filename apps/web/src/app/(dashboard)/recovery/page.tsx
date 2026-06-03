"use client";
import Link from "next/link";
import {
  useRecoveryCandidates,
  useRecoveryStats,
  useReactivateLead,
  useArchiveLead,
  type RecoveryCandidate,
} from "@/features/recovery/useRecovery";

const THRESHOLD_LABEL: Record<string, string> = {
  DAYS_30: "30+ días",
  DAYS_60: "60+ días",
  DAYS_90: "90+ días",
};

const THRESHOLD_STYLE: Record<string, string> = {
  DAYS_30: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
  DAYS_60: "bg-orange-900/40 text-orange-300 border border-orange-700/40",
  DAYS_90: "bg-red-900/40 text-red-300 border border-red-700/40",
};

const TIER_STYLE: Record<string, string> = {
  HOT: "text-red-400",
  WARM: "text-amber-400",
  COLD: "text-zinc-400",
};

function leadName(c: RecoveryCandidate): string {
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(" ");
  return c.phone ?? c.leadId.slice(0, 8) + "…";
}

export default function RecoveryPage() {
  const { data: candidatesData, isLoading, error } = useRecoveryCandidates();
  const { data: statsData } = useRecoveryStats();
  const reactivate = useReactivateLead();
  const archive = useArchiveLead();

  const candidates = candidatesData?.data ?? [];
  const stats = statsData?.data;

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold">Recovery Center</h1>
        <p className="text-sm text-zinc-400">Leads fríos con oportunidad de recuperación — 30 · 60 · 90 días inactivos</p>
      </header>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-xl border border-amber-800/50 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Candidatos</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{stats?.candidates ?? candidates.length}</div>
          <div className="mt-1 text-xs text-zinc-500">Sin recovery activo</div>
        </div>
        <div className="rounded-xl border border-emerald-800/50 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Reactivados</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{stats?.reactivated ?? 0}</div>
          <div className="mt-1 text-xs text-zinc-500">Recuperados históricamente</div>
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Archivados</div>
          <div className="mt-1 text-2xl font-bold text-zinc-400">{stats?.lost ?? 0}</div>
          <div className="mt-1 text-xs text-zinc-500">Marcados como perdidos</div>
        </div>
        <div className="rounded-xl border border-blue-800/50 bg-zinc-900 p-4">
          <div className="text-xs text-zinc-400">Sin respuesta</div>
          <div className="mt-1 text-2xl font-bold text-blue-400">{stats?.noResponse ?? 0}</div>
          <div className="mt-1 text-xs text-zinc-500">Intentados sin éxito</div>
        </div>
      </div>

      {isLoading && <p className="text-zinc-400 text-sm">Cargando candidatos…</p>}

      {error && (
        <div className="rounded-xl border border-red-700/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-red-400">Error al cargar candidatos</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
        </div>
      )}

      {!isLoading && candidates.length === 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-400">No hay leads fríos en este momento.</p>
          <p className="mt-1 text-xs text-zinc-500">Los leads con más de 30 días sin actividad aparecerán aquí.</p>
        </div>
      )}

      {candidates.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Fuente</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Inactividad</th>
                <th className="px-3 py-2">Última actividad</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.leadId} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-3 py-2">
                    <Link href={`/leads/${c.leadId}`} className="text-zinc-200 hover:underline font-medium">
                      {leadName(c)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-400 font-mono text-xs">{c.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{c.source}</td>
                  <td className="px-3 py-2">
                    {c.currentScoreTier ? (
                      <span className={`font-semibold text-xs ${TIER_STYLE[c.currentScoreTier] ?? "text-zinc-400"}`}>
                        {c.currentScoreTier}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${THRESHOLD_STYLE[c.threshold] ?? ""}`}>
                      {THRESHOLD_LABEL[c.threshold] ?? c.threshold}
                    </span>
                    <span className="ml-1 text-xs text-zinc-500">({c.inactivityDays}d)</span>
                  </td>
                  <td className="px-3 py-2 text-zinc-400 text-xs">
                    {new Date(c.lastActivityAt).toLocaleDateString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    <button
                      onClick={() => reactivate.mutate(c.leadId)}
                      disabled={reactivate.isPending}
                      className="rounded bg-emerald-700 px-2 py-1 text-xs hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Reactivar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Archivar a ${leadName(c)}? Quedará marcado como Perdido.`)) {
                          archive.mutate(c.leadId);
                        }
                      }}
                      disabled={archive.isPending}
                      className="rounded bg-zinc-700 px-2 py-1 text-xs hover:bg-zinc-600 disabled:opacity-50"
                    >
                      Archivar
                    </button>
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
