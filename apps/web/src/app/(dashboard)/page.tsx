"use client";
import Link from "next/link";
import { useLeadStats, formatTtfr } from "@/features/leads/useLeadStats";

/**
 * Dashboard de Conversión (FASE 10) — H2: tarjetas accionables + KPI de TTFR.
 * El TTFR medio (tiempo a primera respuesta) es el KPI central del piloto cerrado.
 */
export default function DashboardHome() {
  const { data } = useLeadStats();
  const stats = data?.data;
  const sinRespuesta = stats?.unresponded ?? 0;
  const ttfr = stats?.avgTtfrSeconds ?? null;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Conversión</h1>
      <p className="mb-6 text-sm text-zinc-400">¿Qué debo hacer ahora?</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/leads?unresponded=true"
          className="rounded-xl border border-urgent/40 bg-zinc-900 p-5 hover:border-urgent"
        >
          <div className="text-sm text-zinc-400">🔴 Sin respuesta</div>
          <div className="mt-1 text-3xl font-bold">{sinRespuesta}</div>
          <div className="mt-2 text-sm text-urgent">Responder ahora →</div>
        </Link>

        <div className="rounded-xl border border-emerald-800/50 bg-zinc-900 p-5">
          <div className="text-sm text-zinc-400">⚡ TTFR medio</div>
          <div className="mt-1 text-3xl font-bold">{formatTtfr(ttfr)}</div>
          <div className="mt-2 text-xs text-zinc-500">
            {stats ? `${stats.responded}/${stats.total} leads respondidos` : "Tiempo a primera respuesta"}
          </div>
        </div>

        <Link
          href="/whatsapp"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-emerald-700"
        >
          <div className="text-sm text-zinc-400">💬 Inbox WhatsApp</div>
          <div className="mt-1 text-3xl font-bold">{stats?.total ?? 0}</div>
          <div className="mt-2 text-sm text-emerald-400">Abrir conversaciones →</div>
        </Link>
      </div>
    </div>
  );
}
