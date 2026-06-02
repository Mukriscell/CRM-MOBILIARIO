"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth.store";

// Navegación lead-céntrica (FASE 10): Propiedades casi al final (soporte).
const NAV = [
  { href: "/", label: "⚡ Conversión" },
  { href: "/leads", label: "📥 Bandeja de Leads" },
  { href: "/whatsapp", label: "💬 Inbox WhatsApp" },
  { href: "/pipeline", label: "🪜 Pipeline" },
  { href: "/follow-ups", label: "✅ Seguimientos" },
  { href: "/recovery", label: "♻️ Recovery" },
  { href: "/visits", label: "📅 Visitas" },
  { href: "/properties", label: "🏠 Propiedades" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrate, logout } = useAuth();
  useEffect(() => hydrate(), [hydrate]);

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
        <button onClick={logout} className="mt-6 px-3 text-xs text-zinc-500 hover:text-zinc-300">
          {user ? `Salir (${user.firstName})` : "Salir"}
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
