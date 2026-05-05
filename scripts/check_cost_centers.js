const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const costCenters = await prisma.costCenter.findMany();
  console.log('--- ALL COST CENTERS ---');
  console.log(JSON.stringify(costCenters, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
