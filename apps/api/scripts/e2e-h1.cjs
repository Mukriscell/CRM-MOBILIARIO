/* eslint-disable */
// E2E del Hito H1 SIN servidor HTTP: usa el contenedor de Nest (createApplicationContext)
// y ejecuta los casos de uso reales contra Postgres. Valida:
//  intake (con dedup) → evento lead.created → auto-asignación (router) → bandeja
//  + aislamiento multi-tenant. Ejecutar desde apps/api.
process.env.JWT_ACCESS_SECRET ||= "dev-access";
process.env.JWT_REFRESH_SECRET ||= "dev-refresh";

const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/app.module");
const { CreateLeadUseCase } = require("../dist/modules/leads/application/create-lead.use-case");
const { ListLeadsUseCase } = require("../dist/modules/leads/application/list-leads.use-case");
const { GetLeadUseCase } = require("../dist/modules/leads/application/get-lead.use-case");
const { PrismaService } = require("../dist/infrastructure/database/prisma.service");

let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!cond) failures++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const createLead = app.get(CreateLeadUseCase);
  const listLeads = app.get(ListLeadsUseCase);
  const getLead = app.get(GetLeadUseCase);

  const tenantA = await prisma.tenant.findFirstOrThrow({ where: { slug: "demo" } });
  const tenantB = await prisma.tenant.upsert({
    where: { slug: "demo2" },
    update: {},
    create: { name: "Corredora Dos", slug: "demo2", status: "ACTIVE" },
  });
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenantB.id, email: "broker@demo2.cl" } },
    update: {},
    create: { tenantId: tenantB.id, email: "broker@demo2.cl", passwordHash: "x", firstName: "Beto", lastName: "B", role: "CORREDOR", status: "ACTIVE" },
  });

  const phone = "+5699" + Math.floor(1000000 + Math.random() * 8999999);

  const r1 = await createLead.execute({ tenantId: tenantA.id, firstName: "Juan", phone, source: "LANDING", budgetAmount: 4500, budgetCurrency: "UF" });
  check("Intake crea lead (created)", r1.deduplication === "created");
  const leadId = r1.lead.id;

  const r2 = await createLead.execute({ tenantId: tenantA.id, firstName: "Juan", phone, source: "WHATSAPP" });
  check("Intake duplicado hace merge", r2.deduplication === "merged", `dedup=${r2.deduplication}`);
  check("Merge devuelve el mismo lead", r2.lead.id === leadId);

  await sleep(500); // esperar al listener async lead.created → router
  const detail = await getLead.execute(tenantA.id, leadId);
  check("Lead fue asignado automáticamente", !!detail.assignedUserId, `assignedUserId=${detail.assignedUserId}`);

  const bandejaA = await listLeads.execute(tenantA.id, {}, null, 25);
  check("Lead aparece en la bandeja del tenant A", bandejaA.data.some((l) => l.id === leadId));
  check("Bandeja trae paginación cursor", !!bandejaA.pagination && "hasMore" in bandejaA.pagination);

  const bandejaB = await listLeads.execute(tenantB.id, {}, null, 25);
  check("Tenant B NO ve el lead del tenant A", !bandejaB.data.some((l) => l.id === leadId), `B total=${bandejaB.data.length}`);

  let isolated = false;
  try { await getLead.execute(tenantB.id, leadId); } catch (e) { isolated = e?.code === "NOT_FOUND" || /no encontrado/i.test(e?.message ?? ""); }
  check("getLead cross-tenant lanza NotFound", isolated);

  // Limpieza: las asignaciones son append-only (FK Restrict), se borran primero.
  await prisma.leadAssignment.deleteMany({ where: { leadId } });
  await prisma.lead.deleteMany({ where: { id: leadId } });
  await app.close();
  console.log(failures === 0 ? "\nRESULT: E2E H1 TODO VERDE" : `\nRESULT: ${failures} FALLOS`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("E2E error:", e); process.exit(1); });
