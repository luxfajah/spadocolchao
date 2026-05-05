import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- LIMPANDO REGISTROS DE PONTO ---')

  const tables = [
    'attendanceDay',
    'attendanceMirror',
    'timePunch',
    'timePunchImport',
    'punchRecord',
    'punchImportBatch'
  ]

  for (const table of tables) {
    try {
      const count = await (prisma as any)[table].deleteMany()
      console.log(`- ${table}: ${count.count} registros removidos.`)
    } catch (e: any) {
      console.error(`Erro ao limpar ${table}:`, e.message)
    }
  }

  console.log('--- LIMPEZA CONCLUÍDA ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
