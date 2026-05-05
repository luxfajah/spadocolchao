
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.financialCategory.findMany({
    select: { id: true, code: true, name: true }
  });
  const filtered = categories.filter(c => 
    c.name.includes('Salários') || 
    c.name.includes('Folha') || 
    c.name.includes('Pagamento')
  );
  console.log(JSON.stringify(filtered, null, 2));
  process.exit(0);
}

main();
