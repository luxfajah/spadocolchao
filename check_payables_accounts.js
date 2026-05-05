const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payables = await prisma.accountPayable.findMany({
    where: { status: { not: 'PAID' } },
    select: { id: true, description: true, financialAccountId: true, amount: true, paidAmount: true }
  });
  console.log(JSON.stringify(payables, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
