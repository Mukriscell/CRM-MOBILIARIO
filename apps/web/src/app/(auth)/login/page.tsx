"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { login, hydrate, hydrated, user } = useAuth();
  const [email, setEmail] = useState("admin@demo.cl");
  const [password, setPassword] = useState("clientra123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión, no mostrar el login: ir al inicio.
  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (hydrated && user) router.replace("/");
  }, [hydrated, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <div>
          <h1 className="text-2xl font-bold">CLIENTRA</h1>
          <p className="text-sm text-zinc-400">Nunca pierdas un comprador por falta de seguimiento.</p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        {error && <p className="text-sm text-urgent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          <p className="mb-1 font-medium text-zinc-300">Credenciales de la demo</p>
          <p>Email: <span className="text-zinc-200">admin@demo.cl</span></p>
          <p>Contraseña: <span className="text-zinc-200">clientra123</span></p>
        </div>
      </form>
    </main>
  );
}
