const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const jobTitles = await prisma.jobTitle.findMany({ where: { isActive: true } });
  const workSchedules = await prisma.workSchedule.findMany({ where: { isActive: true } });
  const costCenters = await prisma.costCenter.findMany({ where: { isActive: true } });

  console.log('--- JOB TITLES ---');
  console.log(JSON.stringify(jobTitles, null, 2));
  console.log('--- WORK SCHEDULES ---');
  console.log(JSON.stringify(workSchedules, null, 2));
  console.log('--- COST CENTERS ---');
  console.log(JSON.stringify(costCenters, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
