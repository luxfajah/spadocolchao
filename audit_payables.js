const { PrismaClient } = require('@prisma/client');
/* Note: The above path is likely '@prisma/client'. I should check node_modules or prisma folder. */
const prisma = new PrismaClient();

async function main() {
  const payables = await prisma.accountPayable.findMany({
    where: {
      status: {
        not: 'PAID'
      }
    },
    include: {
      supplier: true,
    }
  });

  console.log(`Found ${payables.length} open payables.`);
  let totalPending = 0;
  payables.forEach(p => {
    const pending = p.amount - p.paidAmount;
    totalPending += pending;
    console.log(`ID: ${p.id}, Description: ${p.description}, Pending: R$ ${pending.toFixed(2)}`);
  });

  console.log(`Total Pending: R$ ${totalPending.toFixed(2)}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
