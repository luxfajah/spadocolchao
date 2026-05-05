
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const salaryCategory = await prisma.financialCategory.findFirst({
    where: { code: 'DESP_SAL' },
    select: { id: true }
  });
  
  if (!salaryCategory) {
    console.error('Category DESP_SAL not found.');
    process.exit(1);
  }
  
  // Find payables from payroll that are using mirrored categories (code starts with CC_)
  const result = await prisma.accountPayable.updateMany({
    where: {
      payrollId: { not: null },
      financialCategory: {
        code: { startsWith: 'CC_' }
      }
    },
    data: {
      financialCategoryId: salaryCategory.id
    }
  });
  
  console.log(`Updated ${result.count} payroll-related payables to 'Salários e Encargos'.`);
  process.exit(0);
}

main();
