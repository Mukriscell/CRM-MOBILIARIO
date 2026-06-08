# Plan de trabajo — CLIENTRA responsivo + PWA

> Objetivo: que el CRM se use **desde el teléfono sin problemas**, en el navegador,
> e instalable como PWA (ícono en la pantalla de inicio, modo standalone).
> No incluye app nativa en tiendas (decisión: el PWA cubre el caso de uso).
>
> Fecha de creación: 2026-06-08 · Inicio previsto: 2026-06-09

---

## Estado actual (diagnóstico)

**Ya está bien posicionado:**
- Tailwind CSS con utilidades responsive en uso (`sm:`, `md:`).
- Next.js inyecta el viewport meta automáticamente → el zoom en móvil funciona.
- Inicio e Inbox WhatsApp ya usan grids responsivos (`sm:grid-cols-3`, `md:grid-cols-[320px_1fr]`).

**Los 2 bloqueantes reales para móvil:**
1. **Sin navegación móvil.** El sidebar es `hidden md:block` en
   [layout.tsx:46](../apps/web/src/app/(dashboard)/layout.tsx#L46). En el teléfono
   no hay menú **ni botón de salir** (ambos viven dentro del sidebar oculto).
2. **3 tablas se cortan.** Envueltas en `overflow-hidden`, en pantallas angostas
   las columnas de la derecha quedan inalcanzables:
   - [leads/page.tsx:261](../apps/web/src/app/(dashboard)/leads/page.tsx#L261)
   - [recovery/page.tsx:91](../apps/web/src/app/(dashboard)/recovery/page.tsx#L91)
   - [seguimientos/page.tsx:85](../apps/web/src/app/(dashboard)/seguimientos/page.tsx#L85)

---

## Fase 1 — Navegación móvil (bloqueante #1, mayor impacto)

**Archivo:** `apps/web/src/app/(dashboard)/layout.tsx`

- Extraer los enlaces de navegación + logout a un bloque `navContent` reutilizable.
- **Escritorio:** mantener el `<aside className="hidden ... md:block">` tal cual.
- **Móvil:** agregar
  - Barra superior `<header className="md:hidden ...">` con botón ☰ + logo CLIENTRA.
  - Drawer deslizable: overlay `fixed inset-0 z-50 md:hidden`, backdrop `bg-black/60`,
    panel izquierdo `w-64`, botón ✕ para cerrar.
- Estado `drawerOpen` con `useState`; cerrar el drawer al navegar usando `usePathname`
  (`useEffect(() => setDrawerOpen(false), [pathname])`).
- Mantener el guard de sesión y el "Cargando…" existentes.

**Resultado:** menú y logout accesibles en el teléfono. (Ya tengo el código listo de
la sesión anterior; se aplica directo.)

**Esfuerzo:** ~1 sesión.

---

## Fase 2 — Tablas que no se cortan

**Archivos:** las 3 páginas con tabla (leads, recovery, seguimientos).

- Cambiar el contenedor `overflow-hidden` → `overflow-x-auto` para permitir scroll
  horizontal y que ninguna columna quede inalcanzable.
- Añadir `whitespace-nowrap` en los `<th>`/celdas clave para que no se aplasten.
- (Opcional / stretch) En `leads`, convertir a tarjetas apiladas en móvil (`md:hidden`
  tarjetas + `hidden md:table` tabla) para una UX más limpia. Dejar para una segunda
  pasada si el scroll horizontal se siente suficiente.

**Esfuerzo:** ~0.5–1 sesión (scroll horizontal es rápido; tarjetas suma tiempo).

---

## Fase 3 — PWA (instalable + standalone)

**Manifest** — `apps/web/src/app/manifest.ts` (Next.js App Router, tipado):
```
name: "CLIENTRA — Conversión de Leads"
short_name: "CLIENTRA"
start_url: "/"
display: "standalone"
background_color: "#09090b"   // zinc-950
theme_color: "#09090b"
icons: [192, 512, maskable]
```

**Íconos** — decidir el enfoque al empezar:
- **Recomendado:** autor `public/icon.svg` (escalable, branded) para favicon y para el
  ícono del manifest en Android/Chrome (aceptan SVG con `sizes: "any"`).
- Para iOS (Safari "Añadir a inicio" no soporta SVG): generar `app/apple-icon.tsx`
  con `ImageResponse` de `next/og` (se pre-renderiza a PNG **en build**, sin riesgo de
  runtime). 180×180.
- Si se requieren PNG 192/512 explícitos: generarlos desde el SVG con `sharp`
  (verificar si está en `node_modules`; Next suele incluirlo) en un script único y
  commitearlos en `public/`.

**Root layout** — `apps/web/src/app/layout.tsx`:
- Añadir `export const viewport = { themeColor: "#09090b" }` (color de la barra de
  direcciones en móvil) y, si hace falta, `width: "device-width", initialScale: 1`.
- Enlazar el manifest vía `metadata.manifest = "/manifest.webmanifest"` (o el archivo
  de convención `manifest.ts` ya lo expone).

**Esfuerzo:** ~0.5 sesión (manifest rápido; los íconos son lo que puede sumar).

---

## Fase 4 — Pulido táctil y verificación

- Revisar tamaños de toque (botones de acción en tablas mínimo ~36–40px de alto).
- Probar en viewport angosto (DevTools responsive + idealmente un teléfono real):
  Inicio, Leads (crear + eliminar), WhatsApp (enviar), Seguimientos, Recovery, login.
- `pnpm --filter @clientra/web typecheck` limpio.
- `pnpm --filter @clientra/web build` limpio (verifica que `next/og`/manifest compilen).
- Confirmar instalabilidad: en Chrome móvil debe aparecer "Instalar app"; en iOS,
  "Añadir a pantalla de inicio" abre en modo standalone.

---

## Orden sugerido para mañana

1. Fase 1 (navegación móvil) → probar en el teléfono. Ya cambia todo.
2. Fase 2 (tablas) → scroll horizontal primero.
3. Fase 3 (PWA) → manifest + íconos.
4. Fase 4 (pulido + build + deploy).

Cada fase es un commit independiente y desplegable. Tras el deploy en Railway, probar
desde el teléfono real con la URL pública.

---

## Notas / decisiones tomadas

- **Sin app nativa.** El PWA (instalable, standalone) cubre "usar desde el teléfono".
  Reconsiderar solo si se necesita distribución en tiendas, push nativo o APIs de
  dispositivo (cámara/GPS).
- **Tablas:** empezar con `overflow-x-auto` (rápido, conserva toda la data). Tarjetas
  apiladas son una mejora opcional posterior.
- **Íconos PWA:** SVG para Android/Chrome + `apple-icon` generado en build para iOS.
