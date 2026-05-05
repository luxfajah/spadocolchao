const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeOrders = await prisma.order.findMany({
    where: { currentStatus: { notIn: ['DELIVERED', 'FINALIZED', 'CANCELLED'] } }
  });

  console.log(`Ordens ativas: ${activeOrders.length}`);
  activeOrders.forEach(o => {
    console.log(`ID: ${o.id}, Status: ${o.currentStatus}, Prometido: ${o.promisedDate?.toISOString()}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
