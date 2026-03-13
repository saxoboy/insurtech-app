import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Tipos de seguro ────────────────────────────────────
  const insuranceTypes = await Promise.all(
    [
      { code: 'AUTO', name: 'Seguro de Auto' },
      { code: 'SALUD', name: 'Seguro de Salud' },
      { code: 'HOGAR', name: 'Seguro de Hogar' },
    ].map((data) =>
      prisma.insuranceType.upsert({
        where: { code: data.code },
        update: {},
        create: data,
      }),
    ),
  );

  console.log(`  ✔ ${insuranceTypes.length} tipos de seguro`);

  // ─── Coberturas (3 por cada tipo = 9) ───────────────────
  const coverageLevels = [
    { code: 'ESTANDAR', name: 'Estándar' },
    { code: 'PREMIUM', name: 'Premium' },
    { code: 'GOLD', name: 'Gold' },
  ];

  let coverageCount = 0;
  for (const type of insuranceTypes) {
    for (const level of coverageLevels) {
      await prisma.coverage.upsert({
        where: {
          code_insuranceTypeId: {
            code: level.code,
            insuranceTypeId: type.id,
          },
        },
        update: {},
        create: {
          code: level.code,
          name: level.name,
          insuranceTypeId: type.id,
        },
      });
      coverageCount++;
    }
  }

  console.log(`  ✔ ${coverageCount} coberturas`);

  // ─── Ubicaciones (provincias Ecuador) ───────────────────
  const locations = await Promise.all(
    [
      { code: 'EC-PICHINCHA', name: 'Pichincha' },
      { code: 'EC-GUAYAS', name: 'Guayas' },
      { code: 'EC-AZUAY', name: 'Azuay' },
      { code: 'EC-MANABI', name: 'Manabí' },
      { code: 'EC-TUNGURAHUA', name: 'Tungurahua' },
      { code: 'EC-LOJA', name: 'Loja' },
    ].map((data) =>
      prisma.location.upsert({
        where: { code: data.code },
        update: {},
        create: data,
      }),
    ),
  );

  console.log(`  ✔ ${locations.length} ubicaciones`);

  // ─── Usuario de prueba ──────────────────────────────────
  const hashedPassword = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: { email: 'demouser@correo.com' },
    update: {},
    create: {
      email: 'demouser@correo.com',
      password: hashedPassword,
      name: 'Usuario de Prueba',
    },
  });

  console.log('  ✔ 1 usuario de prueba (demouser@correo.com / password)');
  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
