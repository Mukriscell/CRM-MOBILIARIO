"use client";
import { useState } from "react";
import Link from "next/link";
import { useLeads, useDeleteLead, LeadRow } from "@/features/leads/useLeads";
import { useAuth } from "@/features/auth/auth.store";
import { apiFetch } from "@/shared/lib/api-client";

const SCORE_STYLE: Record<string, string> = {
  HOT: "bg-red-900/50 text-red-300 border border-red-700/50",
  WARM: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
  COLD: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

const LEAD_SOURCES = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "META_ADS", label: "Meta Ads" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "LANDING", label: "Landing Page" },
  { value: "WEB_FORM", label: "Formulario Web" },
  { value: "PORTAL", label: "Portal Inmobiliario" },
  { value: "REFERIDO", label: "Referido" },
  { value: "OTRO", label: "Otro" },
];

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

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  source: "OTRO",
  commune: "",
  budget: "",
  currency: "UF",
};

function NuevoLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phone && !form.email) {
      setError("Ingresa al menos un teléfono o email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/lead-intake", {
        method: "POST",
        body: JSON.stringify({
          source: form.source,
          contact: {
            ...(form.firstName && { firstName: form.firstName }),
            ...(form.lastName && { lastName: form.lastName }),
            ...(form.phone && { phone: form.phone }),
            ...(form.email && { email: form.email }),
          },
          interest: {
            ...(form.commune && { commune: form.commune }),
            ...(form.budget && { budget: Number(form.budget), currency: form.currency }),
          },
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-bold">Nuevo Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Nombre</label>
              <input
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Juan"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Apellido</label>
              <input
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="González"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Teléfono <span className="text-zinc-600">(o email, al menos uno)</span></label>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+56912345678"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="juan@gmail.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Fuente *</label>
            <select
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Comuna de interés</label>
            <input
              value={form.commune}
              onChange={(e) => set("commune", e.target.value)}
              placeholder="Las Condes"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Presupuesto</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="5000"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Moneda</label>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              >
                <option value="UF">UF</option>
                <option value="CLP">CLP</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Crear Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [unresponded, setUnresponded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading, error, refetch } = useLeads({ unresponded });
  const deleteLead = useDeleteLead();
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div>
      {showModal && (
        <NuevoLeadModal
          onClose={() => setShowModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Bandeja de Leads</h1>
          <p className="text-sm text-zinc-400">¿A quién contacto ahora?</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={unresponded} onChange={(e) => setUnresponded(e.target.checked)} />
            Solo sin respuesta
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
          >
            + Nuevo Lead
          </button>
        </div>
      </header>

      {isLoading && <p className="text-zinc-400">Cargando…</p>}
      {error && (
        <div className="rounded-xl border border-urgent/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-urgent">No se pudo cargar los leads</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
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
                    {isAdmin && (
                      <button
                        onClick={() => {
                          const nombre = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.phone || lead.id.slice(0, 8);
                          if (confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) {
                            deleteLead.mutate(lead.id);
                          }
                        }}
                        disabled={deleteLead.isPending}
                        className="rounded bg-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-800 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
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
