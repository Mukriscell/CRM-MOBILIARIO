import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/shared/providers/QueryProvider";

export const metadata: Metadata = {
  title: "CLIENTRA — Conversión de Leads Inmobiliarios",
  description: "Nunca pierdas un comprador por falta de seguimiento.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
