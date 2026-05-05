const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.financialAccount.findMany({ where: { status: 'ACTIVE' } });
  const categories = await prisma.financialCategory.findMany({ where: { type: 'ENTRY', isActive: true } });
  
  console.log('--- ACCOUNTS ---');
  console.log(accounts.map(a => `${a.name} (${a.id})`).join('\n'));
  
  console.log('--- CATEGORIES ---');
  console.log(categories.map(c => `${c.name} (${c.id})`).join('\n'));
  
  process.exit(0);
}

main();
