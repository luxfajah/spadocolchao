const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.order.count();
  console.log(`Total de ordens no sistema: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
