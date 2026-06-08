import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA). Next.js lo sirve en /manifest.webmanifest y lo
 * enlaza automáticamente. display: "standalone" → se abre como app sin la
 * barra del navegador cuando se instala en el teléfono.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CLIENTRA — Conversión de Leads Inmobiliarios",
    short_name: "CLIENTRA",
    description: "Nunca pierdas un comprador por falta de seguimiento.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
