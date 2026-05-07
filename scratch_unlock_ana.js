const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ana = await prisma.employee.findFirst({
    where: { fullName: { contains: 'Ana', mode: 'insensitive' } }
  });
  console.log("Employee: ", ana?.fullName, ana?.id);

  if (ana) {
    const deletedPayrolls = await prisma.payroll.deleteMany({
      where: { employeeId: ana.id }
    });
    console.log("Deleted payrolls:", deletedPayrolls.count);

    const updatedMirrors = await prisma.attendanceMirror.updateMany({
      where: { employeeId: ana.id, status: 'APPROVED' },
      data: { status: 'ADJUSTED' }
    });
    console.log("Unlocked mirrors:", updatedMirrors.count);
  } else {
    // Delete all payrolls and unlock all mirrors if Ana is not specific, 
    // actually user said "apague os holerites gerados". I will delete all recent payrolls.
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
