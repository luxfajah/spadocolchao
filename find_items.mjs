import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.supplyItem.findMany();
  const cats = await prisma.supplyCategory.findMany();
  const cMap = new Map();
  for (const c of cats) cMap.set(c.id, c.name);

  console.log(JSON.stringify(items.map(i => ({ 
    id: i.id, 
    name: i.name, 
    categoryName: i.categoryId ? cMap.get(i.categoryId) : null,
    imageUrl: i.imageUrl
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
