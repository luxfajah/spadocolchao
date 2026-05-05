const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.orderProductionSlip.count({
    where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } }
  });
  console.log(`OrderProductionSlips em aberto: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
