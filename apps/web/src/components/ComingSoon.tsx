import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  hito: string;
}

export default function ComingSoon({ title, description, hito }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="text-5xl">🚧</div>
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-zinc-400 max-w-md">{description}</p>
      <span className="inline-block bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded-full">
        Disponible en {hito}
      </span>
      <Link
        href="/leads"
        className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
      >
        ← Volver a la Bandeja de Leads
      </Link>
    </div>
  );
}
