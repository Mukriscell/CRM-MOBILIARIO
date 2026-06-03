"use client";
import { useState } from "react";
import Link from "next/link";
import {
  useFollowUps,
  useExecuteFollowUp,
  useCancelFollowUp,
  FollowUpFilter,
  FollowUpRow,
} from "@/features/follow-ups/useFollowUps";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-900/40 text-amber-300 border border-amber-700/40",
  SENT: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40",
  CANCELLED: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  FAILED: "bg-red-900/40 text-red-300 border border-red-700/40",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  SENT: "Ejecutado",
  CANCELLED: "Cancelado",
  FAILED: "Fallido",
};

const TABS: { key: FollowUpFilter; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "overdue", label: "Vencidos" },
  { key: "executed", label: "Ejecutados" },
  { key: "cancelled", label: "Cancelados" },
];

function isOverdue(row: FollowUpRow): boolean {
  return row.status === "PENDING" && new Date(row.scheduledAt) <= new Date();
}

export default function SeguimientosPage() {
  const [tab, setTab] = useState<FollowUpFilter>("pending");
  const { data, isLoading, error } = useFollowUps(tab);
  const executeOne = useExecuteFollowUp();
  const cancelOne = useCancelFollowUp();

  const rows = data?.data ?? [];

  return (
    <div>
      <header className="mb-5">
        <h1 className="text-xl font-bold">Seguimientos</h1>
        <p className="text-sm text-zinc-400">Cadencias automáticas para cada lead — Día 1 · 3 · 7 · 14</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-zinc-800 pb-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
              tab === key
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-zinc-400 text-sm">Cargando…</p>}

      {error && (
        <div className="rounded-xl border border-red-700/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-red-400">Error al cargar seguimientos</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
          Sin seguimientos en esta vista
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2">Lead</th>
                <th className="px-3 py-2">Día</th>
                <th className="px-3 py-2">Canal</th>
                <th className="px-3 py-2">Programado</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${isOverdue(row) ? "bg-red-950/20" : ""}`}
                >
                  <td className="px-3 py-2">
                    <Link href={`/leads/${row.leadId}`} className="text-zinc-300 hover:underline font-mono text-xs">
                      {row.leadId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-300 font-medium">Día {row.sequenceStep}</td>
                  <td className="px-3 py-2 text-zinc-400">{row.channel}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {new Date(row.scheduledAt).toLocaleString("es-CL", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isOverdue(row) && (
                      <span className="ml-2 text-xs text-red-400 font-semibold">VENCIDO</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${STATUS_STYLE[row.status] ?? ""}`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex gap-2">
                    {row.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => executeOne.mutate(row.id)}
                          disabled={executeOne.isPending}
                          className="rounded bg-emerald-700 px-2 py-1 text-xs hover:bg-emerald-600 disabled:opacity-50"
                        >
                          Hacer seguimiento
                        </button>
                        <button
                          onClick={() => cancelOne.mutate(row.id)}
                          disabled={cancelOne.isPending}
                          className="rounded bg-zinc-700 px-2 py-1 text-xs hover:bg-zinc-600 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {row.status === "SENT" && row.executedAt && (
                      <span className="text-xs text-zinc-500">
                        {new Date(row.executedAt).toLocaleString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
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
