const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deletedPayrolls = await prisma.payroll.deleteMany({
    where: { status: { in: ['DRAFT', 'GENERATED'] } }
  });
  console.log("Deleted ALL draft/generated payrolls:", deletedPayrolls.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
