
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date('2026-03-30');
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const sales = await prisma.sale.aggregate({
    _sum: {
      totalAmount: true
    },
    where: {
      saleDate: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      status: 'CONFIRMED'
    }
  });

  const categories = await prisma.financialCategory.findMany({
    where: { isActive: true }
  });

  const accounts = await prisma.financialAccount.findMany({
    where: { status: 'ACTIVE' }
  });

  console.log('REVENUE_MARCH_2026:', sales._sum.totalAmount || 0);
  console.log('CATEGORIES:', JSON.stringify(categories, null, 2));
  console.log('ACCOUNTS:', JSON.stringify(accounts, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
