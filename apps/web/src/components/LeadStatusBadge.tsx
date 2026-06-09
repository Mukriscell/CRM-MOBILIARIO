import { cn } from "@/lib/utils";

/** Etiquetas legibles + color por etapa del pipeline (consistente con el Kanban). */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NUEVO: { label: "Nuevo", className: "bg-sky-900/50 text-sky-300 border-sky-700/50" },
  CONTACTADO: { label: "Contactado", className: "bg-indigo-900/50 text-indigo-300 border-indigo-700/50" },
  INTERESADO: { label: "Interesado", className: "bg-violet-900/50 text-violet-300 border-violet-700/50" },
  VISITA_AGENDADA: { label: "Visita agendada", className: "bg-purple-900/50 text-purple-300 border-purple-700/50" },
  NEGOCIACION: { label: "Negociación", className: "bg-amber-900/50 text-amber-300 border-amber-700/50" },
  RESERVA: { label: "Reserva", className: "bg-orange-900/50 text-orange-300 border-orange-700/50" },
  VENTA_CERRADA: { label: "Venta cerrada", className: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50" },
  PERDIDO: { label: "Perdido", className: "bg-zinc-800 text-zinc-400 border-zinc-700" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
