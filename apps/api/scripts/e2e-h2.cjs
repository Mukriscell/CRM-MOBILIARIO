/* eslint-disable */
// E2E del Hito H2 SIN servidor HTTP: usa el contenedor de Nest (createApplicationContext).
// Valida el flujo WhatsApp + TTFR:
//  intake → autorespuesta automática (speed-to-lead) → mensaje entrante del cliente →
//  respuesta del corredor (marca TTFR) → stats con TTFR medio.
// Ejecutar desde apps/api: node scripts/e2e-h2.cjs
process.env.JWT_ACCESS_SECRET ||= "dev-access";
process.env.JWT_REFRESH_SECRET ||= "dev-refresh";

const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/app.module");
const { CreateLeadUseCase } = require("../dist/modules/leads/application/create-lead.use-case");
const { GetLeadStatsUseCase } = require("../dist/modules/leads/application/get-lead-stats.use-case");
const { ListConversationsUseCase } = require("../dist/modules/messaging/application/list-conversations.use-case");
const { GetThreadUseCase } = require("../dist/modules/messaging/application/get-thread.use-case");
const { SendMessageUseCase } = require("../dist/modules/messaging/application/send-message.use-case");
const { ReceiveInboundMessageUseCase } = require("../dist/modules/messaging/application/receive-inbound-message.use-case");
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
  const getStats = app.get(GetLeadStatsUseCase);
  const listConvs = app.get(ListConversationsUseCase);
  const getThread = app.get(GetThreadUseCase);
  const sendMessage = app.get(SendMessageUseCase);
  const receiveInbound = app.get(ReceiveInboundMessageUseCase);

  const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug: "demo" } });
  const broker = await prisma.user.findFirstOrThrow({ where: { tenantId: tenant.id, role: "CORREDOR" } });

  const phone = "+5699" + Math.floor(1000000 + Math.random() * 8999999);

  // 1) Intake → dispara autorespuesta (speed-to-lead)
  const r1 = await createLead.execute({ tenantId: tenant.id, firstName: "Sofía", phone, source: "LANDING" });
  const leadId = r1.lead.id;
  check("Intake crea lead", r1.deduplication === "created");

  await sleep(600); // esperar listeners async (router + autorespuesta)

  // 2) La autorespuesta creó conversación + mensaje OUTBOUND automático
  const convs = await listConvs.execute(tenant.id);
  const conv = convs.find((c) => c.waContactPhone === phone);
  check("Autorespuesta creó la conversación", !!conv);
  check("Conversación vinculada al lead", conv && conv.leadId === leadId);

  const thread1 = await getThread.execute(tenant.id, conv.id);
  const auto = thread1.messages.find((m) => m.direction === "OUTBOUND" && m.sentByUserId === null);
  check("Existe mensaje de autorespuesta (OUTBOUND automático)", !!auto);

  // 3) El cliente responde (mensaje entrante)
  await receiveInbound.execute({ tenantId: tenant.id, fromPhone: phone, body: "Hola, me interesa el depto" });
  const thread2 = await getThread.execute(tenant.id, conv.id);
  check("Mensaje entrante registrado (INBOUND)", thread2.messages.some((m) => m.direction === "INBOUND"));

  // 4) El corredor responde desde la app → marca TTFR
  const leadBefore = await prisma.lead.findUnique({ where: { id: leadId } });
  check("Lead sin TTFR antes de respuesta humana", leadBefore.firstResponseAt === null);

  await sleep(1000);
  await sendMessage.execute({ tenantId: tenant.id, conversationId: conv.id, body: "¡Hola Sofía! Claro, te cuento.", userId: broker.id });

  const leadAfter = await prisma.lead.findUnique({ where: { id: leadId } });
  check("Respuesta del corredor marca firstResponseAt (TTFR)", leadAfter.firstResponseAt !== null);
  const ttfr = leadAfter.firstResponseAt ? (leadAfter.firstResponseAt - leadAfter.createdAt) / 1000 : null;
  check("TTFR es un valor positivo en segundos", ttfr !== null && ttfr >= 1, `ttfr=${ttfr}s`);

  // 5) Una segunda respuesta NO sobrescribe el TTFR (idempotente)
  const firstResp = leadAfter.firstResponseAt.getTime();
  await sendMessage.execute({ tenantId: tenant.id, conversationId: conv.id, body: "Te llamo en la tarde.", userId: broker.id });
  const leadAfter2 = await prisma.lead.findUnique({ where: { id: leadId } });
  check("TTFR no se sobrescribe en respuestas posteriores", leadAfter2.firstResponseAt.getTime() === firstResp);

  // 6) Stats exponen TTFR medio
  const stats = await getStats.execute(tenant.id);
  check("Stats reportan al menos 1 lead respondido", stats.responded >= 1, `responded=${stats.responded}`);
  check("Stats calculan TTFR medio", stats.avgTtfrSeconds !== null, `avgTtfr=${stats.avgTtfrSeconds}s`);

  // 7) Aislamiento: el mensaje de simulación es append-only correcto por tenant
  check("Hilo solo tiene mensajes del tenant", thread2.messages.every((m) => m.tenantId === tenant.id));

  // Limpieza
  await prisma.message.deleteMany({ where: { conversationId: conv.id } });
  await prisma.conversation.deleteMany({ where: { id: conv.id } });
  await prisma.leadAssignment.deleteMany({ where: { leadId } });
  await prisma.lead.deleteMany({ where: { id: leadId } });

  await app.close();
  console.log(failures === 0 ? "\nRESULT: E2E H2 TODO VERDE" : `\nRESULT: ${failures} FALLOS`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error("E2E error:", e); process.exit(1); });
