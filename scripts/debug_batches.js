const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const batches = await prisma.punchImportBatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  console.log('Total Batches:', batches.length)
  console.log('Sample Batches:', JSON.stringify(batches, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
