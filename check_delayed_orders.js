const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const delayedOrders = await prisma.order.findMany({
    where: {
      currentStatus: { notIn: ['DELIVERED', 'FINALIZED', 'CANCELLED'] },
      promisedDate: { lt: now }
    },
    include: {
        sale: true
    }
  });

  console.log(`Total de pedidos atrasados encontrados: ${delayedOrders.length}`);
  delayedOrders.slice(0, 10).forEach(o => {
    console.log(`ID: ${o.id}, Status: ${o.currentStatus}, Prometido: ${o.promisedDate.toISOString()}, Venda: ${o.sale?.number}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
