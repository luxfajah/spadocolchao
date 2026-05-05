const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      fullName: true,
      serialId: true,
      admissionDate: true,
    },
    orderBy: {
      admissionDate: 'asc',
    },
  });

  console.log(`Total employees: ${employees.length}`);
  employees.forEach((e, i) => {
    console.log(`${i + 1}: [${e.serialId}] ${e.fullName} (Admission: ${e.admissionDate})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
