import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const sequences = await prisma.documentSequence.findMany();
  console.log('Document Sequences:');
  console.log(sequences);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
