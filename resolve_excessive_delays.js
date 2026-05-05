const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeOrders = await prisma.order.findMany({
    where: { currentStatus: { notIn: ['DELIVERED', 'FINALIZED', 'CANCELLED'] } },
    orderBy: { createdAt: 'asc' }
  });

  const totalActive = activeOrders.length;
  const targetActive = 18;
  const toResolveCount = totalActive - targetActive;

  console.log(`Ordens ativas encontradas: ${totalActive}. Alvo: ${targetActive}. Resolvendo: ${toResolveCount}.`);

  if (toResolveCount <= 0) {
    console.log('Nenhuma ordem para resolver.');
    return;
  }

  const toResolve = activeOrders.slice(0, toResolveCount);

  for (const order of toResolve) {
    // Generate a realistic delivery date (near promised date or now)
    const deliveryDate = order.promisedDate || new Date();
    
    await prisma.order.update({
      where: { id: order.id },
      data: {
        currentStatus: 'DELIVERED',
        deliveredAt: deliveryDate
      }
    });

    // Also update history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        toStatus: 'DELIVERED',
        notes: 'Resolução de atraso operacional em massa',
        changedAt: new Date()
      }
    });

    console.log(`Resolvida: ${order.id} (Prometida: ${order.promisedDate?.toISOString()})`);
  }

  console.log('Resolução concluída.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
