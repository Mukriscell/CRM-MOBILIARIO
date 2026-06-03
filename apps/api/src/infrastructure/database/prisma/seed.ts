/**
 * Seed idempotente para desarrollo: un tenant demo, un plan, un admin, dos corredores
 * y un set de datos de demostración (leads, conversaciones, mensajes) para que la
 * primera impresión no esté vacía: el dashboard muestra leads sin responder y TTFR real.
 * Ejecutar: pnpm --filter @clientra/api db:seed
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

async function main() {
  const plan = await prisma.plan.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      tier: "PROFESSIONAL",
      name: "Professional",
      priceClp: 79000,
    },
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Corredora Demo", slug: "demo", rut: "76000000-0", status: "ACTIVE" },
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, planId: plan.id, status: "ACTIVE" },
  });

  const passwordHash = await bcrypt.hash("clientra123", 10);

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.cl" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo.cl",
      passwordHash,
      firstName: "Ana",
      lastName: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const brokers: Record<string, string> = {};
  for (const [email, firstName] of [
    ["diego@demo.cl", "Diego"],
    ["carla@demo.cl", "Carla"],
  ]) {
    const u = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      update: {},
      create: {
        tenantId: tenant.id,
        email,
        passwordHash,
        firstName,
        lastName: "Corredor",
        role: "CORREDOR",
        status: "ACTIVE",
      },
    });
    brokers[firstName] = u.id;
  }

  // ─── Datos de demostración (solo si el tenant aún no tiene leads) ────────────
  const existingLeads = await prisma.lead.count({ where: { tenantId: tenant.id } });
  if (existingLeads === 0) {
    type DemoLead = {
      firstName: string;
      lastName: string;
      phone: string;
      source: "LANDING" | "META_ADS" | "WHATSAPP" | "PORTAL" | "INSTAGRAM";
      tier: "HOT" | "WARM" | "COLD";
      createdMinAgo: number;
      ttfrMin: number | null; // null = sin responder
      broker: "Diego" | "Carla";
    };

    const demo: DemoLead[] = [
      { firstName: "Sofía", lastName: "Reyes", phone: "+56991111111", source: "META_ADS", tier: "HOT", createdMinAgo: 120, ttfrMin: null, broker: "Diego" },
      { firstName: "Matías", lastName: "Soto", phone: "+56992222222", source: "LANDING", tier: "WARM", createdMinAgo: 47, ttfrMin: null, broker: "Carla" },
      { firstName: "Valentina", lastName: "Muñoz", phone: "+56993333333", source: "WHATSAPP", tier: "HOT", createdMinAgo: 12, ttfrMin: null, broker: "Diego" },
      { firstName: "Felipe", lastName: "Rojas", phone: "+56994444444", source: "PORTAL", tier: "WARM", createdMinAgo: 600, ttfrMin: 4, broker: "Carla" },
      { firstName: "Camila", lastName: "Díaz", phone: "+56995555555", source: "INSTAGRAM", tier: "COLD", createdMinAgo: 1440, ttfrMin: 9, broker: "Diego" },
      { firstName: "Joaquín", lastName: "Vera", phone: "+56996666666", source: "LANDING", tier: "HOT", createdMinAgo: 2880, ttfrMin: 2, broker: "Carla" },
    ];

    for (const d of demo) {
      const createdAt = minutesAgo(d.createdMinAgo);
      const firstResponseAt = d.ttfrMin !== null ? new Date(createdAt.getTime() + d.ttfrMin * 60_000) : null;
      const brokerId = brokers[d.broker];

      const lead = await prisma.lead.create({
        data: {
          tenantId: tenant.id,
          firstName: d.firstName,
          lastName: d.lastName,
          phone: d.phone,
          source: d.source,
          status: firstResponseAt ? "CONTACTADO" : "NUEVO",
          currentScoreTier: d.tier,
          assignedUserId: brokerId,
          firstResponseAt,
          createdAt,
          lastActivityAt: firstResponseAt ?? createdAt,
        },
      });

      await prisma.leadAssignment.create({
        data: { tenantId: tenant.id, leadId: lead.id, userId: brokerId, assignedBy: "SYSTEM", reason: { rule: "seed" } },
      });

      // Conversación con autorespuesta (y respuesta del corredor si fue contactado)
      const conv = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          leadId: lead.id,
          waContactPhone: d.phone,
          assignedUserId: brokerId,
          status: "OPEN",
          lastMessageAt: firstResponseAt ?? createdAt,
          windowExpiresAt: new Date((firstResponseAt ?? createdAt).getTime() + 24 * 60 * 60 * 1000),
        },
      });

      await prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conv.id,
          direction: "OUTBOUND",
          body: `Hola ${d.firstName} 👋, gracias por tu interés. Un asesor te contactará en breve. ¿En qué te podemos ayudar?`,
          sentByUserId: null, // automático
          createdAt,
          metadata: { auto: true },
        },
      });

      await prisma.message.create({
        data: {
          tenantId: tenant.id,
          conversationId: conv.id,
          direction: "INBOUND",
          body: "Hola, me interesa, ¿me pueden dar más información?",
          createdAt: new Date(createdAt.getTime() + 60_000),
        },
      });

      if (firstResponseAt) {
        await prisma.message.create({
          data: {
            tenantId: tenant.id,
            conversationId: conv.id,
            direction: "OUTBOUND",
            body: `¡Hola ${d.firstName}! Claro, con gusto. ¿Te acomoda una visita esta semana?`,
            sentByUserId: brokerId,
            createdAt: firstResponseAt,
          },
        });
      }
    }
    // eslint-disable-next-line no-console
    console.log(`Datos de demo creados: ${demo.length} leads con conversaciones.`);
  }

  // eslint-disable-next-line no-console
  console.log(`Seed listo. Tenant 'demo' (${tenant.id}). Login: admin@demo.cl / clientra123`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
