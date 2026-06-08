/**
 * Seed idempotente: un tenant, un plan, usuarios y datos de demo opcionales.
 *
 * Sin argumentos  → tenant demo (admin@demo.cl / clientra123)
 * Con JSON path   → tenant desde archivo (pnpm db:seed -- tenant.json)
 *
 * Formato JSON:
 * {
 *   "name": "Corredora Norte",
 *   "slug": "norte",
 *   "rut": "76111111-1",
 *   "admin": { "email": "admin@norte.cl", "password": "...", "firstName": "Ana", "lastName": "García" },
 *   "brokers": [{ "email": "broker@norte.cl", "password": "...", "firstName": "Luis", "lastName": "Soto" }]
 * }
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";

const prisma = new PrismaClient();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

interface BrokerConfig {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface TenantConfig {
  name: string;
  slug: string;
  rut: string;
  admin: { email: string; password: string; firstName: string; lastName: string };
  brokers: BrokerConfig[];
  seedDemoLeads?: boolean;
}

const DEMO_CONFIG: TenantConfig = {
  name: "Corredora Demo",
  slug: "demo",
  rut: "76000000-0",
  admin: { email: "admin@demo.cl", password: "clientra123", firstName: "Ana", lastName: "Admin" },
  brokers: [
    { email: "diego@demo.cl", password: "clientra123", firstName: "Diego", lastName: "Corredor" },
    { email: "carla@demo.cl", password: "clientra123", firstName: "Carla", lastName: "Corredor" },
  ],
  seedDemoLeads: true,
};

function loadConfig(): TenantConfig {
  const arg = process.argv[2];
  if (!arg) return DEMO_CONFIG;
  const raw = JSON.parse(readFileSync(arg, "utf-8")) as Partial<TenantConfig>;
  return { seedDemoLeads: false, ...raw } as TenantConfig;
}

async function main() {
  const config = loadConfig();

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
    where: { slug: config.slug },
    update: {},
    create: { name: config.name, slug: config.slug, rut: config.rut, status: "ACTIVE" },
  });

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, planId: plan.id, status: "ACTIVE" },
  });

  const adminHash = await bcrypt.hash(config.admin.password, 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: config.admin.email } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: config.admin.email,
      passwordHash: adminHash,
      firstName: config.admin.firstName,
      lastName: config.admin.lastName,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const brokerIds: string[] = [];
  for (const broker of config.brokers) {
    const hash = await bcrypt.hash(broker.password, 10);
    const u = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: broker.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: broker.email,
        passwordHash: hash,
        firstName: broker.firstName,
        lastName: broker.lastName,
        role: "CORREDOR",
        status: "ACTIVE",
      },
    });
    brokerIds.push(u.id);
  }

  // ─── Datos de demostración (solo si el tenant aún no tiene leads) ────────────
  if (config.seedDemoLeads) {
    const existingLeads = await prisma.lead.count({ where: { tenantId: tenant.id } });
    if (existingLeads === 0) {
      type DemoLead = {
        firstName: string;
        lastName: string;
        phone: string;
        source: "LANDING" | "META_ADS" | "WHATSAPP" | "PORTAL" | "INSTAGRAM";
        tier: "HOT" | "WARM" | "COLD";
        createdMinAgo: number;
        ttfrMin: number | null;
        brokerIdx: 0 | 1;
      };

      const demo: DemoLead[] = [
        { firstName: "Sofía",    lastName: "Reyes",  phone: "+56991111111", source: "META_ADS",   tier: "HOT",  createdMinAgo: 120,  ttfrMin: null, brokerIdx: 0 },
        { firstName: "Matías",   lastName: "Soto",   phone: "+56992222222", source: "LANDING",    tier: "WARM", createdMinAgo: 47,   ttfrMin: null, brokerIdx: 1 },
        { firstName: "Valentina",lastName: "Muñoz",  phone: "+56993333333", source: "WHATSAPP",   tier: "HOT",  createdMinAgo: 12,   ttfrMin: null, brokerIdx: 0 },
        { firstName: "Felipe",   lastName: "Rojas",  phone: "+56994444444", source: "PORTAL",     tier: "WARM", createdMinAgo: 600,  ttfrMin: 4,    brokerIdx: 1 },
        { firstName: "Camila",   lastName: "Díaz",   phone: "+56995555555", source: "INSTAGRAM",  tier: "COLD", createdMinAgo: 1440, ttfrMin: 9,    brokerIdx: 0 },
        { firstName: "Joaquín",  lastName: "Vera",   phone: "+56996666666", source: "LANDING",    tier: "HOT",  createdMinAgo: 2880, ttfrMin: 2,    brokerIdx: 1 },
      ];

      for (const d of demo) {
        const createdAt = minutesAgo(d.createdMinAgo);
        const firstResponseAt = d.ttfrMin !== null ? new Date(createdAt.getTime() + d.ttfrMin * 60_000) : null;
        const brokerId = brokerIds[d.brokerIdx] ?? brokerIds[0];

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
            sentByUserId: null,
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
  }

  // ─── Propiedades de demo (catálogo base para agendar visitas) ───────────────
  if (config.seedDemoLeads) {
    const existingProps = await prisma.property.count({ where: { tenantId: tenant.id } });
    if (existingProps === 0) {
      type DemoProperty = {
        internalCode: string;
        type: "DEPTO" | "CASA" | "OFICINA" | "TERRENO" | "LOCAL";
        commune: string;
        address: string;
        priceAmount: number;
        priceCurrency: "UF" | "CLP";
        bedrooms: number | null;
        bathrooms: number | null;
        areaBuiltM2: number | null;
      };

      const demoProps: DemoProperty[] = [
        { internalCode: "DEP-001", type: "DEPTO", commune: "Providencia", address: "Av. Pedro de Valdivia 1234, depto 802", priceAmount: 4200, priceCurrency: "UF", bedrooms: 2, bathrooms: 2, areaBuiltM2: 65 },
        { internalCode: "CAS-002", type: "CASA",  commune: "La Reina",    address: "Los Cipreses 567",                  priceAmount: 9800, priceCurrency: "UF", bedrooms: 4, bathrooms: 3, areaBuiltM2: 180 },
        { internalCode: "DEP-003", type: "DEPTO", commune: "Ñuñoa",       address: "Irarrázaval 4321, depto 305",        priceAmount: 3500, priceCurrency: "UF", bedrooms: 1, bathrooms: 1, areaBuiltM2: 45 },
        { internalCode: "OFI-004", type: "OFICINA", commune: "Las Condes", address: "Apoquindo 5500, of. 1402",          priceAmount: 5200, priceCurrency: "UF", bedrooms: null, bathrooms: 2, areaBuiltM2: 90 },
        { internalCode: "CAS-005", type: "CASA",  commune: "Peñalolén",   address: "Av. Las Parcelas 890",               priceAmount: 7400, priceCurrency: "UF", bedrooms: 3, bathrooms: 2, areaBuiltM2: 140 },
      ];

      for (const p of demoProps) {
        await prisma.property.create({
          data: {
            tenantId: tenant.id,
            internalCode: p.internalCode,
            type: p.type,
            status: "ACTIVA",
            address: p.address,
            region: "Metropolitana",
            commune: p.commune,
            priceAmount: p.priceAmount,
            priceCurrency: p.priceCurrency,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            areaBuiltM2: p.areaBuiltM2,
            assignedUserId: brokerIds[0] ?? null,
          },
        });
      }
      // eslint-disable-next-line no-console
      console.log(`Propiedades de demo creadas: ${demoProps.length}.`);
    }
  }

  // SEC-06: generar API key del webhook si el tenant no tiene una
  if (!tenant.webhookApiKey) {
    const apiKey = "clientra_wh_" + randomBytes(20).toString("hex");
    await prisma.tenant.update({ where: { id: tenant.id }, data: { webhookApiKey: apiKey } });
    // eslint-disable-next-line no-console
    console.log(`Webhook API key generada para '${config.slug}': ${apiKey}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Seed listo. Tenant '${config.slug}' (${tenant.id}). Login: ${config.admin.email}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
