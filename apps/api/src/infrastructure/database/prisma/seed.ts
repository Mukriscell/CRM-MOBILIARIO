/**
 * Seed idempotente para desarrollo: un tenant demo, un plan, un admin y dos corredores.
 * Ejecutar: pnpm --filter @clientra/api db:seed
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

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

  for (const [email, firstName] of [
    ["diego@demo.cl", "Diego"],
    ["carla@demo.cl", "Carla"],
  ]) {
    await prisma.user.upsert({
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
