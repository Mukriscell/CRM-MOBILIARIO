"use client";
import Link from "next/link";
import { useLeads } from "@/features/leads/useLeads";

/**
 * Dashboard de Conversión (FASE 10) — versión H1: tarjetas accionables.
 * En H1 mostramos la cola "sin respuesta"; los KPIs de TTFR/conversión llegan en H2+.
 */
export default function DashboardHome() {
  const { data } = useLeads({ unresponded: true });
  const sinRespuesta = data?.data.length ?? 0;

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

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 opacity-60">
          <div className="text-sm text-zinc-400">🟠 Seguimientos hoy</div>
          <div className="mt-1 text-3xl font-bold">—</div>
          <div className="mt-2 text-xs text-zinc-500">Disponible en H4</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 opacity-60">
          <div className="text-sm text-zinc-400">♻️ Recuperables</div>
          <div className="mt-1 text-3xl font-bold">—</div>
          <div className="mt-2 text-xs text-zinc-500">Disponible en H5</div>
        </div>
      </div>
    </div>
  );
}
