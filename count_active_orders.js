const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.order.count({
    where: { currentStatus: { notIn: ['DELIVERED', 'FINALIZED', 'CANCELLED'] } }
  });
  console.log(`Ordens não finalizadas: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
