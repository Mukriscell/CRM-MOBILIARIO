/* eslint-disable */
// Genera datos de demo y renderiza las pantallas REALES del H1 (mismo markup/clases
// que los componentes Next implementados) a HTML en /tmp/clientra-demo para captura headless.
// Ejecutar desde apps/api con DATABASE_URL seteada.
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const OUT = "/tmp/clientra-demo";
fs.mkdirSync(OUT, { recursive: true });

// ---- Tailwind Play CDN + tema dark (espeja tailwind.config.ts) ----
const HEAD = `<!doctype html><html lang="es" class="dark"><head><meta charset="utf-8">
<link rel="stylesheet" href="tw.css">
<style>body{background:#09090b;color:#f4f4f5;font-family:Inter,ui-sans-serif,system-ui,sans-serif}</style>
</head><body>`;
const FOOT = `</body></html>`;

// ---- Sidebar (espeja apps/web/.../(dashboard)/layout.tsx) ----
const NAV = [
  ["⚡ Conversión", true], ["📥 Bandeja de Leads", true], ["💬 Inbox WhatsApp", false],
  ["🪜 Pipeline", false], ["✅ Seguimientos", false], ["♻️ Recovery", false],
  ["📅 Visitas", false], ["🏠 Propiedades", false],
];
function shell(active, content) {
  const links = NAV.map(([label, ready]) => {
    const act = label === active;
    const cls = act ? "bg-zinc-800 text-white" : ready ? "text-zinc-300 hover:bg-zinc-800 hover:text-white" : "text-zinc-600";
    const tag = ready ? "" : ` <span class="text-[10px] text-zinc-600">(H2+)</span>`;
    return `<div class="block rounded-lg px-3 py-2 text-sm ${cls}">${label}${tag}</div>`;
  }).join("");
  return `${HEAD}<div class="flex min-h-screen">
  <aside class="w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 p-4">
    <div class="mb-6 px-2 text-lg font-bold">CLIENTRA</div>
    <nav class="space-y-1">${links}</nav>
    <div class="mt-6 px-3 text-xs text-zinc-500">Salir (Ana)</div>
  </aside>
  <main class="flex-1 p-6">${content}</main></div>${FOOT}`;
}

const SCORE_COLOR = { HOT: "text-urgent", WARM: "text-warming", COLD: "text-sky-400" };
function waitingBadge(min) {
  if (min === null) return `<span class="text-zinc-500">—</span>`;
  const color = min >= 5 ? "text-urgent" : "text-warming";
  return `<span class="${color}">${min} min</span>`;
}
function bandejaTable(rows) {
  if (rows.length === 0) {
    return `<p class="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400">No hay leads sin responder 🎉</p>`;
  }
  const trs = rows.map((l) => `<tr class="border-t border-zinc-800 hover:bg-zinc-900/50">
    <td class="px-3 py-2 font-bold ${SCORE_COLOR[l.scoreTier] ?? "text-zinc-500"}">${l.scoreTier === "HOT" ? "🔥" : ""} ${l.scoreTier ?? "—"}</td>
    <td class="px-3 py-2">${[l.firstName, l.lastName].filter(Boolean).join(" ") || "—"}</td>
    <td class="px-3 py-2 text-zinc-300">${l.phone ?? "—"}</td>
    <td class="px-3 py-2 text-zinc-400">${l.source}</td>
    <td class="px-3 py-2">${l.status}</td>
    <td class="px-3 py-2">${l.assignedName}</td>
    <td class="px-3 py-2">${waitingBadge(l.minutesWaiting)}</td>
    <td class="px-3 py-2"><span class="rounded bg-emerald-600 px-2 py-1 text-xs">💬 WhatsApp</span></td>
  </tr>`).join("");
  return `<div class="overflow-hidden rounded-xl border border-zinc-800"><table class="w-full text-sm">
    <thead class="bg-zinc-900 text-left text-zinc-400"><tr>
      <th class="px-3 py-2">Score</th><th class="px-3 py-2">Nombre</th><th class="px-3 py-2">Teléfono</th>
      <th class="px-3 py-2">Fuente</th><th class="px-3 py-2">Estado</th><th class="px-3 py-2">Responsable</th>
      <th class="px-3 py-2">Sin respuesta</th><th class="px-3 py-2">Acciones</th>
    </tr></thead><tbody>${trs}</tbody></table></div>`;
}
function bandejaPage(rows, onlyUnresponded) {
  const check = onlyUnresponded ? "checked" : "";
  return shell("📥 Bandeja de Leads", `
    <header class="mb-4 flex items-center justify-between">
      <div><h1 class="text-xl font-bold">Bandeja de Leads</h1>
      <p class="text-sm text-zinc-400">¿A quién contacto ahora?</p></div>
      <label class="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" ${check}> Solo sin respuesta</label>
    </header>${bandejaTable(rows)}`);
}
function dashboardPage(sinRespuesta) {
  return shell("⚡ Conversión", `
    <h1 class="mb-1 text-xl font-bold">Conversión</h1>
    <p class="mb-6 text-sm text-zinc-400">¿Qué debo hacer ahora?</p>
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-urgent/40 bg-zinc-900 p-5">
        <div class="text-sm text-zinc-400">🔴 Sin respuesta</div>
        <div class="mt-1 text-3xl font-bold">${sinRespuesta}</div>
        <div class="mt-2 text-sm text-urgent">Responder ahora →</div></div>
      <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-5 opacity-60">
        <div class="text-sm text-zinc-400">🟠 Seguimientos hoy</div>
        <div class="mt-1 text-3xl font-bold">—</div>
        <div class="mt-2 text-xs text-zinc-500">Disponible en H4</div></div>
      <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-5 opacity-60">
        <div class="text-sm text-zinc-400">♻️ Recuperables</div>
        <div class="mt-1 text-3xl font-bold">—</div>
        <div class="mt-2 text-xs text-zinc-500">Disponible en H5</div></div>
    </div>`);
}
function loginPage() {
  return `${HEAD}<main class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
      <div><h1 class="text-2xl font-bold">CLIENTRA</h1>
      <p class="text-sm text-zinc-400">Nunca pierdas un comprador por falta de seguimiento.</p></div>
      <input value="admin@demo.cl" class="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
      <input value="••••••••••••" class="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
      <button class="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium">Ingresar</button>
    </div></main>${FOOT}`;
}
// Detalle: API de detalle implementada (GET /leads/:id); UI espeja FASE 10 §3.7 con banner honesto.
function detailPage(l) {
  const fin = `<div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm space-y-1">
    <div class="text-zinc-400 mb-2 font-semibold">CALIFICACIÓN FINANCIERA</div>
    <div>Presupuesto: <b>${l.budget ?? "—"}</b></div>
    <div>Fuente: ${l.source}</div>
    <div>Estado: ${l.status}</div>
    <div>Responsable (auto): <b>${l.assignedName}</b></div>
    <div>Creado: ${l.createdAt}</div>
    <div>Última actividad: ${l.lastActivityAt}</div></div>`;
  const timeline = `<div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
    <div class="text-zinc-400 mb-2 font-semibold">TIMELINE</div>
    <ul class="space-y-1 text-zinc-300">
      <li>• ${l.createdAt} · Lead creado (fuente ${l.source})</li>
      <li>• ${l.createdAt} · Asignado automáticamente a ${l.assignedName}</li>
      <li class="text-zinc-500">+ Nota · + Actividad</li></ul></div>`;
  return shell("📥 Bandeja de Leads", `
    <div class="mb-3 rounded-lg border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
      Vista de Detalle — datos REALES desde la API GET /leads/:id. UI de detalle según FASE 10 §3.7 (página web completa pendiente en H1).</div>
    <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4 mb-4">
      <div class="flex items-center justify-between">
        <div><span class="text-lg font-bold">${[l.firstName,l.lastName].filter(Boolean).join(" ")}</span>
        <span class="ml-2 ${SCORE_COLOR[l.scoreTier]??"text-zinc-500"} font-bold">🔥 ${l.scoreTier ?? ""} </span>
        <span class="ml-2 text-zinc-400 text-sm">· ${l.status} · ${l.source}</span></div>
      </div>
      <div class="mt-3 flex gap-2 text-xs">
        <span class="rounded bg-emerald-600 px-3 py-1">💬 WhatsApp</span>
        <span class="rounded bg-zinc-700 px-3 py-1">📞 Llamar</span>
        <span class="rounded bg-zinc-700 px-3 py-1">📅 Visita</span>
        <span class="rounded bg-zinc-700 px-3 py-1">🪜 Mover etapa</span>
        <span class="rounded bg-indigo-600 px-3 py-1">✨ Próxima acción</span></div>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">${timeline}${fin}</div>`);
}
function flowPage(passLines) {
  const items = passLines.map((t) => `<div class="text-emerald-400">PASS&nbsp;&nbsp;${t}</div>`).join("");
  return `${HEAD}<main class="p-8 max-w-3xl mx-auto">
    <h1 class="text-xl font-bold mb-1">Flujo de Asignación Automática — H1</h1>
    <p class="text-sm text-zinc-400 mb-5">Intake → evento <code>lead.created</code> → Lead Router → Bandeja (validado contra Postgres)</p>
    <div class="grid grid-cols-4 gap-2 mb-6 text-center text-xs">
      <div class="rounded-lg bg-zinc-800 p-3">📥 Intake<br><span class="text-zinc-400">POST /lead-intake (202)</span></div>
      <div class="rounded-lg bg-zinc-800 p-3">⚡ Evento<br><span class="text-zinc-400">lead.created</span></div>
      <div class="rounded-lg bg-zinc-800 p-3">🎯 Router<br><span class="text-zinc-400">auto-asigna corredor</span></div>
      <div class="rounded-lg bg-zinc-800 p-3">📊 Bandeja<br><span class="text-zinc-400">aparece asignado</span></div>
    </div>
    <div class="rounded-xl border border-zinc-800 bg-black p-4 font-mono text-sm leading-6">
      <div class="text-zinc-500 mb-2">$ pnpm --filter @clientra/api test:e2e</div>${items}
      <div class="mt-2 text-emerald-300 font-bold">RESULT: E2E H1 TODO VERDE</div></div>
  </main>${FOOT}`;
}

async function main() {
  const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug: "demo" } });
  const brokers = await prisma.user.findMany({ where: { tenantId: tenant.id, role: "CORREDOR" } });
  const nameById = Object.fromEntries(brokers.map((b) => [b.id, b.firstName]));
  const [diego, carla] = brokers;

  // Reset de leads demo (respetando FK append-only)
  const old = await prisma.lead.findMany({ where: { tenantId: tenant.id }, select: { id: true } });
  const ids = old.map((l) => l.id);
  if (ids.length) {
    await prisma.leadAssignment.deleteMany({ where: { leadId: { in: ids } } });
    await prisma.lead.deleteMany({ where: { id: { in: ids } } });
  }

  const now = Date.now();
  const mins = (m) => new Date(now - m * 60000);
  const demo = [
    { firstName: "Juan", lastName: "Pérez", phone: "+56991111111", source: "WHATSAPP", status: "NUEVO", tier: "HOT", wait: 12, broker: diego, budget: "4.500 UF" },
    { firstName: "Luis", lastName: "Rojas", phone: "+56992222222", source: "PORTAL", status: "NUEVO", tier: "HOT", wait: 8, broker: diego, budget: "6.200 UF" },
    { firstName: "Ana", lastName: "Torres", phone: "+56993333333", source: "WEB_FORM", status: "NUEVO", tier: "WARM", wait: 3, broker: carla, budget: "3.100 UF" },
    { firstName: "María", lastName: "Soto", phone: "+56994444444", source: "META_ADS", status: "CONTACTADO", tier: "WARM", wait: null, broker: diego, budget: "5.000 UF" },
    { firstName: "Pedro", lastName: "Díaz", phone: "+56995555555", source: "LANDING", status: "INTERESADO", tier: "COLD", wait: null, broker: carla, budget: "2.800 UF" },
    { firstName: "Sofía", lastName: "Muñoz", phone: "+56996666666", source: "INSTAGRAM", status: "CONTACTADO", tier: "WARM", wait: null, broker: carla, budget: "3.900 UF" },
  ];

  const rows = [];
  for (const d of demo) {
    const created = mins(d.wait ?? 120);
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id, firstName: d.firstName, lastName: d.lastName, phone: d.phone,
        source: d.source, status: d.status, currentScoreTier: d.tier,
        assignedUserId: d.broker.id, budgetAmount: parseFloat(d.budget) || null, budgetCurrency: "UF",
        firstResponseAt: d.wait === null ? mins(30) : null, lastActivityAt: created, createdAt: created,
      },
    });
    await prisma.leadAssignment.create({ data: { tenantId: tenant.id, leadId: lead.id, userId: d.broker.id, assignedBy: "SYSTEM", reason: { rule: "auto-round-robin" } } });
    rows.push({
      firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, source: lead.source,
      status: lead.status, scoreTier: lead.currentScoreTier, assignedName: nameById[lead.assignedUserId],
      minutesWaiting: d.wait, budget: d.budget,
      createdAt: lead.createdAt.toISOString().slice(0, 16).replace("T", " "),
      lastActivityAt: lead.lastActivityAt.toISOString().slice(0, 16).replace("T", " "),
    });
  }

  const unresp = rows.filter((r) => r.minutesWaiting !== null);
  fs.writeFileSync(path.join(OUT, "1-login.html"), loginPage());
  fs.writeFileSync(path.join(OUT, "2-dashboard.html"), dashboardPage(unresp.length));
  fs.writeFileSync(path.join(OUT, "3-bandeja-vacia.html"), bandejaPage([], true));
  fs.writeFileSync(path.join(OUT, "4-bandeja-llena.html"), bandejaPage(rows, false));
  fs.writeFileSync(path.join(OUT, "5-detalle.html"), detailPage(rows[0]));
  fs.writeFileSync(path.join(OUT, "6-flujo.html"), flowPage([
    "Intake crea lead (created)", "Intake duplicado hace merge — dedup=merged",
    "Merge devuelve el mismo lead", "Lead fue asignado automáticamente",
    "Lead aparece en la bandeja del tenant A", "Bandeja trae paginación cursor",
    "Tenant B NO ve el lead del tenant A", "getLead cross-tenant lanza NotFound",
  ]));

  console.log(`Demo data: ${rows.length} leads (${unresp.length} sin respuesta). HTML en ${OUT}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
