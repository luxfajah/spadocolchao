import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- LIMPANDO TODOS OS REGISTROS DE PONTO ---')
  const tables = [
    'attendanceDay',
    'attendanceMirror',
    'timePunch',
    'timePunchImport',
    'punchRecord',
    'punchImportBatch'
  ]

  for (const table of tables) {
    const count = await (prisma as any)[table].deleteMany()
    console.log(`- ${table}: ${count.count} removidos.`)
  }
}

main().finally(() => prisma.$disconnect())
