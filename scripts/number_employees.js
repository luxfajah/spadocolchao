const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      fullName: true,
      admissionDate: true,
    },
    orderBy: {
      admissionDate: 'asc',
    },
  });

  console.log(`Numbering ${employees.length} employees...`);

  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    const serialId = i + 1;
    
    await prisma.employee.update({
      where: { id: employee.id },
      data: { serialId },
    });

    console.log(`Updated: #${serialId.toString().padStart(4, '0')} - ${employee.fullName}`);
  }

  console.log('All employees numbered successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
