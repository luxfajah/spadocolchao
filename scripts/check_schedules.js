const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.workSchedule.findMany({ where: { isActive: true } });
  console.log('Total active schedules:', s.length);
  console.log(s.map(x => x.name).join(', '));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
