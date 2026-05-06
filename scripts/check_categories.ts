import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.productService.findMany({
    select: { operationalCategory: true },
    distinct: ['operationalCategory'],
  });

  console.log('Categorias Operacionais existentes:');
  console.log(categories.map(c => c.operationalCategory));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
