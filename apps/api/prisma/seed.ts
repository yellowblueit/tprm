import { PrismaClient } from '@prisma/client';
import { DATA_CLASSIFICATIONS } from '@tprm/shared';
import { SECURITY_DOMAINS } from '@tprm/shared';
import { COMPLIANCE_FRAMEWORKS } from '@tprm/shared';
import { DEFAULT_SCORING_MATRIX } from '@tprm/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ===== DATA TYPES =====
  console.log('Seeding data types...');
  for (const dc of DATA_CLASSIFICATIONS) {
    await prisma.dataType.upsert({
      where: {
        category_name: {
          category: dc.category as 'COMPANY' | 'CUSTOMER',
          name: dc.name,
        },
      },
      update: {
        sensitivityLevel: dc.sensitivityLevel as 'EXTREME' | 'MEDIUM' | 'LOW',
        weightPercentage: dc.weightPercentage,
        sortOrder: dc.sortOrder,
      },
      create: {
        category: dc.category as 'COMPANY' | 'CUSTOMER',
        name: dc.name,
        sensitivityLevel: dc.sensitivityLevel as 'EXTREME' | 'MEDIUM' | 'LOW',
        weightPercentage: dc.weightPercentage,
        sortOrder: dc.sortOrder,
      },
    });
  }
  console.log(`  Seeded ${DATA_CLASSIFICATIONS.length} data types`);

  // ===== SECURITY DOMAINS =====
  console.log('Seeding security domains...');
  for (const domain of SECURITY_DOMAINS) {
    await prisma.securityDomain.upsert({
      where: { code: domain.code },
      update: {
        name: domain.name,
        description: domain.description,
        sortOrder: domain.sortOrder,
      },
      create: {
        code: domain.code,
        name: domain.name,
        description: domain.description,
        sortOrder: domain.sortOrder,
      },
    });
  }
  console.log(`  Seeded ${SECURITY_DOMAINS.length} security domains`);

  // ===== COMPLIANCE FRAMEWORKS =====
  console.log('Seeding compliance frameworks...');
  for (const framework of COMPLIANCE_FRAMEWORKS) {
    await prisma.complianceFramework.upsert({
      where: { code: framework.code },
      update: {
        name: framework.name,
        description: framework.description,
        version: framework.version ?? null,
        category: framework.category,
      },
      create: {
        code: framework.code,
        name: framework.name,
        description: framework.description,
        version: framework.version ?? null,
        category: framework.category,
        isActive: true,
      },
    });
  }
  console.log(`  Seeded ${COMPLIANCE_FRAMEWORKS.length} compliance frameworks`);

  // ===== MSP TENANT =====
  console.log('Seeding MSP tenant...');
  const mspTenant = await prisma.tenant.upsert({
    where: { slug: 'msp-admin' },
    update: {},
    create: {
      name: 'MSP Administration',
      slug: 'msp-admin',
      type: 'MSP',
      isActive: true,
    },
  });
  console.log(`  MSP tenant: ${mspTenant.id}`);

  // ===== DEFAULT SCORING MATRIX for MSP =====
  console.log('Seeding default scoring matrix...');
  await prisma.scoringMatrix.upsert({
    where: {
      tenantId_name: {
        tenantId: mspTenant.id,
        name: 'Default',
      },
    },
    update: {
      config: DEFAULT_SCORING_MATRIX as unknown as Record<string, unknown>,
    },
    create: {
      tenantId: mspTenant.id,
      name: 'Default',
      isActive: true,
      config: DEFAULT_SCORING_MATRIX as unknown as Record<string, unknown>,
    },
  });
  console.log('  Default scoring matrix created');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
