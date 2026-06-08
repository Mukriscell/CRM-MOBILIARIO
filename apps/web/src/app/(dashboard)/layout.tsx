"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const { user, hydrated, hydrate, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => hydrate(), [hydrate]);

  // Guard: si tras hidratar no hay sesión, ir al login.
  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  // Cierra el drawer al navegar (móvil).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

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

  // Contenido de navegación reutilizado por el sidebar (escritorio) y el drawer (móvil).
  const navContent = (
    <>
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
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 p-4 md:block">
        {navContent}
      </aside>

      {/* Drawer móvil + backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Cerrar menú"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-zinc-800 bg-zinc-900 p-4">
            <button
              aria-label="Cerrar menú"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              ✕
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior móvil */}
        <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
          <button
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-1.5 text-2xl leading-none text-zinc-300 hover:bg-zinc-800"
          >
            ☰
          </button>
          <span className="text-lg font-bold">CLIENTRA</span>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
