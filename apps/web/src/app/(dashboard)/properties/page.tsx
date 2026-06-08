"use client";
import { useState } from "react";
import { useProperties, useCreateProperty, PropertyRow, CreatePropertyPayload } from "@/features/properties/useProperties";

const TYPE_LABELS: Record<string, string> = {
  DEPTO: "Departamento",
  CASA: "Casa",
  OFICINA: "Oficina",
  TERRENO: "Terreno",
  LOCAL: "Local",
  BODEGA: "Bodega",
  ESTACIONAMIENTO: "Estacionamiento",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVA: "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50",
  RESERVADA: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
  VENDIDA: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  INACTIVA: "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

const PROPERTY_TYPES = Object.keys(TYPE_LABELS);

function priceLabel(p: PropertyRow): string {
  if (p.priceAmount === null) return "—";
  return `${p.priceAmount.toLocaleString("es-CL")} ${p.priceCurrency}`;
}

const EMPTY_FORM = {
  internalCode: "",
  type: "DEPTO",
  status: "ACTIVA",
  address: "",
  commune: "",
  priceAmount: "",
  priceCurrency: "UF",
  bedrooms: "",
  bathrooms: "",
  areaBuiltM2: "",
  description: "",
};

function NuevaPropiedadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const createProperty = useCreateProperty();

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.internalCode.trim()) {
      setError("El código interno es requerido.");
      return;
    }
    setError(null);
    const payload: CreatePropertyPayload = {
      internalCode: form.internalCode.trim(),
      type: form.type,
      status: form.status,
      ...(form.address && { address: form.address }),
      ...(form.commune && { commune: form.commune }),
      ...(form.priceAmount && { priceAmount: Number(form.priceAmount), priceCurrency: form.priceCurrency }),
      ...(form.bedrooms && { bedrooms: Number(form.bedrooms) }),
      ...(form.bathrooms && { bathrooms: Number(form.bathrooms) }),
      ...(form.areaBuiltM2 && { areaBuiltM2: Number(form.areaBuiltM2) }),
      ...(form.description && { description: form.description }),
    };
    try {
      await createProperty.mutateAsync(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-bold">Nueva Propiedad</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Código interno *</label>
              <input value={form.internalCode} onChange={(e) => set("internalCode", e.target.value)} placeholder="DEP-001" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Tipo *</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Dirección</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. Providencia 1234" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Comuna</label>
              <input value={form.commune} onChange={(e) => set("commune", e.target.value)} placeholder="Providencia" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Estado</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                <option value="ACTIVA">Activa</option>
                <option value="RESERVADA">Reservada</option>
                <option value="VENDIDA">Vendida</option>
                <option value="INACTIVA">Inactiva</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Precio</label>
              <input type="number" value={form.priceAmount} onChange={(e) => set("priceAmount", e.target.value)} placeholder="4200" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Moneda</label>
              <select value={form.priceCurrency} onChange={(e) => set("priceCurrency", e.target.value)} className={inputCls}>
                <option value="UF">UF</option>
                <option value="CLP">CLP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Dorm.</label>
              <input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} placeholder="2" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Baños</label>
              <input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">m² const.</label>
              <input type="number" value={form.areaBuiltM2} onChange={(e) => set("areaBuiltM2", e.target.value)} placeholder="65" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Descripción</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className={inputCls} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-800">
              Cancelar
            </button>
            <button type="submit" disabled={createProperty.isPending} className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50">
              {createProperty.isPending ? "Guardando…" : "Crear Propiedad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading, error, refetch } = useProperties();

  return (
    <div>
      {showModal && <NuevaPropiedadModal onClose={() => setShowModal(false)} onSuccess={() => refetch()} />}

      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Propiedades</h1>
          <p className="text-sm text-zinc-400">Catálogo de inmuebles para agendar visitas.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500">
          + Nueva Propiedad
        </button>
      </header>

      {isLoading && <p className="text-zinc-400">Cargando…</p>}
      {error && (
        <div className="rounded-xl border border-red-700/40 bg-zinc-900 p-5 text-sm">
          <p className="font-semibold text-red-400">No se pudo cargar las propiedades</p>
          <p className="mt-1 text-zinc-400">{(error as Error).message}</p>
        </div>
      )}

      {data && data.data.length === 0 && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">
          No hay propiedades aún. Crea la primera con “+ Nueva Propiedad”.
        </p>
      )}

      {data && data.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Dirección</th>
                <th className="px-3 py-2">Comuna</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Dorm./Baños</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((p: PropertyRow) => (
                <tr key={p.id} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-3 py-2 font-mono text-zinc-300">{p.internalCode}</td>
                  <td className="px-3 py-2 text-zinc-300">{TYPE_LABELS[p.type] ?? p.type}</td>
                  <td className="px-3 py-2 text-zinc-400">{p.address ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-400">{p.commune ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-300">{priceLabel(p)}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {p.bedrooms ?? "—"} / {p.bathrooms ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${STATUS_STYLE[p.status] ?? ""}`}>
                      {p.status}
                    </span>
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
