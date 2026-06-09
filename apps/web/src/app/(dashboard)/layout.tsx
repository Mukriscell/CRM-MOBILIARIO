"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth.store";
import { cn } from "@/lib/utils";

// Navegación lead-céntrica (FASE 10): Propiedades casi al final (soporte).
const NAV = [
  { href: "/", label: "Inicio", icon: "⚡", exact: true },
  { href: "/leads", label: "Bandeja de Leads", icon: "📥" },
  { href: "/whatsapp", label: "Inbox WhatsApp", icon: "💬" },
  { href: "/pipeline", label: "Pipeline", icon: "🪜" },
  { href: "/seguimientos", label: "Seguimientos", icon: "✅" },
  { href: "/recovery", label: "Recovery", icon: "♻️" },
  { href: "/visits", label: "Visitas", icon: "📅" },
  { href: "/properties", label: "Propiedades", icon: "🏠" },
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
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          C
        </span>
        <span className="text-lg font-bold tracking-tight">CLIENTRA</span>
      </div>
      <nav className="flex-1 space-y-0.5">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-800 font-medium text-white"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
              )}
            >
              <span className="w-5 text-center text-base leading-none">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-2.5 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <span className="w-5 text-center text-base leading-none">↪</span>
        <span className="truncate">Salir ({user.firstName})</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar escritorio */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 p-4 md:flex md:flex-col">
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
