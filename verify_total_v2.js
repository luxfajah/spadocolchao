const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.accountPayable.aggregate({
    _sum: {
      amount: true
    },
    where: {
      notes: {
        contains: 'Simulação Massiva - 48% da meta'
      }
    }
  });

  const count = await prisma.accountPayable.count({
    where: {
      notes: {
        contains: 'Simulação Massiva - 48% da meta'
      }
    }
  });

  console.log(JSON.stringify({ total: result._sum.amount, count }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
