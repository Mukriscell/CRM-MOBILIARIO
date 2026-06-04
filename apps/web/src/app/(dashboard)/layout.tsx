"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth.store";

// Navegación lead-céntrica (FASE 10): Propiedades casi al final (soporte).
const NAV = [
  { href: "/", label: "⚡ Inicio" },
  { href: "/leads", label: "📥 Bandeja de Leads" },
  { href: "/whatsapp", label: "💬 Inbox WhatsApp" },
  { href: "/pipeline", label: "🪜 Pipeline" },
  { href: "/seguimientos", label: "✅ Seguimientos" },
  { href: "/recovery", label: "♻️ Recovery" },
  { href: "/visits", label: "📅 Visitas" },
  { href: "/properties", label: "🏠 Propiedades" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hydrated, hydrate, logout } = useAuth();

  useEffect(() => hydrate(), [hydrate]);

  // Guard: si tras hidratar no hay sesión, ir al login.
  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Evita el "flash" del dashboard antes de redirigir.
  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 p-4 md:block">
        <div className="mb-6 px-2 text-lg font-bold">CLIENTRA</div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-6 px-3 text-xs text-zinc-500 hover:text-zinc-300">
          Salir ({user.firstName})
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
