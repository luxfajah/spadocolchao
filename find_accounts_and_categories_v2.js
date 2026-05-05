const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const goals = await prisma.storeGoal.findMany({
    where: {
      startDate: {
        gte: new Date('2026-03-01'),
        lte: new Date('2026-03-31')
      }
    }
  });

  const cats = await prisma.financialCategory.findMany({
    where: {
      type: 'EXIT'
    }
  });

  const costCenters = await prisma.costCenter.findMany();
  
  const suppliers = await prisma.supplier.findMany({
    take: 5
  });

  console.log(JSON.stringify({ goals, cats, costCenters, suppliers }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
