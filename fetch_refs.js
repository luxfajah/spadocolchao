const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [leadSources, sellers] = await Promise.all([
    prisma.leadSource.findMany({ select: { id: true, name: true } }),
    prisma.seller.findMany({ select: { id: true, name: true } })
  ]);
  console.log(JSON.stringify({ leadSources, sellers }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
