"use client";
import { use } from "react";
import Link from "next/link";
import { useLeadScore, useRecalculateScore, ScoreReason } from "@/features/leads/useLeadScore";

const TIER_STYLE: Record<string, string> = {
  HOT: "bg-red-900/50 text-red-300 border border-red-700/50",
  WARM: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
  COLD: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

const TIER_BAR: Record<string, string> = {
  HOT: "bg-red-500",
  WARM: "bg-amber-400",
  COLD: "bg-zinc-500",
};

function ScoreBar({ value, tier }: { value: number; tier: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>Score</span>
        <span className="font-bold">{value} / 100</span>
      </div>
      <div className="h-3 w-full rounded-full bg-zinc-800">
        <div
          className={`h-3 rounded-full transition-all ${TIER_BAR[tier] ?? "bg-zinc-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ReasonRow({ reason }: { reason: ScoreReason }) {
  const positive = reason.delta > 0;
  return (
    <li className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-300">{reason.description}</span>
      <span className={`text-sm font-bold tabular-nums ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {positive ? "+" : ""}{reason.delta}
      </span>
    </li>
  );
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useLeadScore(id);
  const recalculate = useRecalculateScore(id);

  const score = data?.data;
  const latest = score?.latest;

  async function handleRecalculate() {
    try {
      await recalculate.mutateAsync(undefined);
      void refetch();
    } catch (err) {
      alert(`No se pudo recalcular el score: ${(err as Error).message}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/leads" className="text-zinc-400 hover:text-white text-sm">
          ← Bandeja
        </Link>
        <h1 className="text-xl font-bold">Score del lead</h1>
      </div>

      {isLoading && <p className="text-zinc-400 text-sm">Cargando score…</p>}

      {error && (
        <div className="rounded-xl border border-urgent/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-urgent">No se pudo cargar el score</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
        </div>
      )}

      {score && (
        <>
          {/* Score actual */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Score actual</p>
                {latest ? (
                  <span className={`inline-block rounded px-2 py-1 text-sm font-bold ${TIER_STYLE[latest.tier] ?? ""}`}>
                    {latest.tier}
                  </span>
                ) : (
                  <span className="text-zinc-500 text-sm">Sin score aún</span>
                )}
              </div>
              <button
                onClick={handleRecalculate}
                disabled={recalculate.isPending}
                className="rounded-lg bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                {recalculate.isPending ? "Recalculando…" : "Recalcular score"}
              </button>
            </div>

            {latest && (
              <>
                <ScoreBar value={latest.scoreValue} tier={latest.tier} />

                {/* Razones */}
                {latest.reasons && latest.reasons.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Factores</p>
                    <ul>
                      {latest.reasons.map((r) => (
                        <ReasonRow key={r.rule} reason={r} />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">Sin datos financieros para calificar.</p>
                )}

                <p className="mt-3 text-xs text-zinc-600">
                  Calculado: {new Date(latest.scoredAt).toLocaleString("es-CL")} · Fuente: {latest.source}
                </p>
              </>
            )}
          </div>

          {/* Histórico */}
          {score.history.length > 1 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Histórico de scores</p>
              <ul className="space-y-2">
                {score.history.map((entry, i) => (
                  <li key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{new Date(entry.scoredAt).toLocaleString("es-CL")}</span>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${TIER_STYLE[entry.tier] ?? ""}`}>
                        {entry.tier}
                      </span>
                      <span className="text-zinc-300 tabular-nums">{entry.scoreValue}</span>
                      {i === 0 && <span className="text-xs text-zinc-600">actual</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
