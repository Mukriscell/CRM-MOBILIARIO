"use client";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth.store";
import { useLeadStats, formatTtfr } from "@/features/leads/useLeadStats";
import { useLeads } from "@/features/leads/useLeads";

/**
 * Inicio (FASE 10) — pensado para que una corredora entienda el valor en 30s:
 * saludo directo, qué hacer ahora, y cuánto tarda en responder (su KPI).
 */
export default function DashboardHome() {
  const user = useAuth((s) => s.user);
  const { data: statsData } = useLeadStats();
  const { data: leadsData } = useLeads({ unresponded: true });

  const stats = statsData?.data;
  const sinRespuesta = stats?.unresponded ?? 0;
  const ttfr = stats?.avgTtfrSeconds ?? null;

  // El más antiguo esperando (la lista viene de más nuevo a más viejo)
  const esperas = (leadsData?.data ?? [])
    .map((l) => l.minutesWaiting ?? 0)
    .filter((m) => m > 0);
  const masAntiguoMin = esperas.length ? Math.max(...esperas) : 0;
  const masAntiguoTxt =
    masAntiguoMin >= 60 ? `${Math.floor(masAntiguoMin / 60)} h ${masAntiguoMin % 60} min` : `${masAntiguoMin} min`;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Hola {user?.firstName ?? ""} 👋</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {sinRespuesta > 0 ? (
          <>
            Tienes <span className="font-semibold text-urgent">{sinRespuesta} lead{sinRespuesta === 1 ? "" : "s"} sin responder</span>
            {masAntiguoMin > 0 && <> — el más antiguo lleva {masAntiguoTxt} esperando.</>}
          </>
        ) : (
          <>Estás al día: no tienes leads sin responder. 🎉</>
        )}
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/leads?unresponded=true"
          className="rounded-xl border border-urgent/40 bg-zinc-900 p-5 hover:border-urgent"
        >
          <div className="text-sm text-zinc-400">Leads sin responder</div>
          <div className="mt-1 text-3xl font-bold">{sinRespuesta}</div>
          <div className="mt-2 text-sm text-urgent">Responder ahora →</div>
        </Link>

        <div className="rounded-xl border border-emerald-800/50 bg-zinc-900 p-5">
          <div className="text-sm text-zinc-400">Respondes en promedio</div>
          <div className="mt-1 text-3xl font-bold">{formatTtfr(ttfr)}</div>
          <div className="mt-2 text-xs text-zinc-500">
            {stats ? `${stats.responded} de ${stats.total} leads contactados` : "Tiempo hasta tu primera respuesta"}
          </div>
        </div>

        <Link
          href="/whatsapp"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-emerald-700"
        >
          <div className="text-sm text-zinc-400">Conversaciones WhatsApp</div>
          <div className="mt-1 text-3xl font-bold">{stats?.total ?? 0}</div>
          <div className="mt-2 text-sm text-emerald-400">Abrir el inbox →</div>
        </Link>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Prioridad de leads</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/leads"
          className="rounded-xl border border-red-800/50 bg-zinc-900 p-5 hover:border-red-600"
        >
          <div className="text-sm text-zinc-400">HOT — Alta probabilidad</div>
          <div className="mt-1 text-3xl font-bold text-red-400">{stats?.hot ?? 0}</div>
          <div className="mt-2 text-xs text-zinc-500">Listos para cerrar</div>
        </Link>

        <Link
          href="/leads"
          className="rounded-xl border border-amber-800/50 bg-zinc-900 p-5 hover:border-amber-600"
        >
          <div className="text-sm text-zinc-400">WARM — Media probabilidad</div>
          <div className="mt-1 text-3xl font-bold text-amber-400">{stats?.warm ?? 0}</div>
          <div className="mt-2 text-xs text-zinc-500">Requieren seguimiento</div>
        </Link>

        <Link
          href="/leads"
          className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 hover:border-zinc-500"
        >
          <div className="text-sm text-zinc-400">COLD — Baja probabilidad</div>
          <div className="mt-1 text-3xl font-bold text-zinc-400">{stats?.cold ?? 0}</div>
          <div className="mt-2 text-xs text-zinc-500">Pendientes de calificación</div>
        </Link>
      </div>

      <p className="mt-8 max-w-2xl text-sm text-zinc-500">
        CLIENTRA captura cada lead que llega, le responde al instante por WhatsApp y te muestra
        a quién contactar primero — para que no se te escape ningún comprador por demorar.
      </p>
    </div>
  );
}
