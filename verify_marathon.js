const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startDate = new Date(2026, 2, 1);
  const endDate = new Date(2026, 3, 1);

  const salesCount = await prisma.sale.count({
    where: { saleDate: { gte: startDate, lt: endDate } }
  });

  const totalRevenue = await prisma.sale.aggregate({
    where: { saleDate: { gte: startDate, lt: endDate } },
    _sum: { totalAmount: true }
  });

  const customerCount = await prisma.customer.count();

  const orders = await prisma.order.groupBy({
    by: ['currentStatus'],
    _count: { id: true },
    where: { createdAt: { gte: startDate, lt: endDate } }
  });

  const santander = await prisma.financialAccount.findUnique({
    where: { id: 'acc_santander' }
  });

  console.log('--- Resumo Março 2026 ---');
  console.log(`Vendas: ${salesCount}`);
  console.log(`Receita Total: R$ ${totalRevenue._sum.totalAmount.toFixed(2)}`);
  console.log(`Clientes Totais: ${customerCount}`);
  console.log('Status de Pedidos:', JSON.stringify(orders, null, 2));
  console.log(`Saldo Santander: R$ ${santander.currentBalance.toFixed(2)}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
