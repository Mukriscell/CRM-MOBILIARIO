/**
 * Crea (o actualiza) un usuario CORREDOR en un tenant existente.
 * Idempotente: si el email ya existe en el tenant, no falla.
 *
 * Uso (las credenciales se pasan por variables de entorno para no quedar en logs):
 *
 *   NEW_USER_EMAIL=jesus@demo.cl \
 *   NEW_USER_PASSWORD='claveSegura' \
 *   NEW_USER_FIRST=Jesus \
 *   NEW_USER_LAST=Perez \
 *   NEW_USER_TENANT=demo \
 *   railway run --service clientra-api pnpm --filter @clientra/api exec tsx scripts/create-corredor.ts
 *
 * NEW_USER_TENANT es el slug del tenant (por defecto "demo").
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.NEW_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.NEW_USER_PASSWORD;
  const firstName = process.env.NEW_USER_FIRST?.trim() || "Corredor";
  const lastName = process.env.NEW_USER_LAST?.trim() || "";
  const tenantSlug = process.env.NEW_USER_TENANT?.trim() || "demo";

  if (!email || !password) {
    throw new Error("Faltan NEW_USER_EMAIL y/o NEW_USER_PASSWORD");
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) throw new Error(`Tenant '${tenantSlug}' no encontrado`);

  const existing = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`El usuario ${email} ya existe en '${tenantSlug}' (id ${existing.id}). No se modifica.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      passwordHash,
      firstName,
      lastName,
      role: "CORREDOR",
      status: "ACTIVE",
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Usuario CORREDOR creado: ${email} (id ${user.id}) en tenant '${tenantSlug}'.`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
