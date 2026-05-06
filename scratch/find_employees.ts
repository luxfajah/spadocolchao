import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:L3FNzJyWUfh%23.E%21@db.tqstaitdzyfyjjdrpven.supabase.co:5432/postgres"
    }
  }
})

async function main() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      fullName: true,
      pointMachineId: true
    }
  })

  const edgar = employees.filter(e => e.fullName.toLowerCase().includes('edgar'))
  const eduardo = employees.filter(e => e.fullName.toLowerCase().includes('eduardo'))

  console.log('--- Funcionários Encontrados ---')
  console.log('Edgar:', JSON.stringify(edgar, null, 2))
  console.log('Eduardo:', JSON.stringify(eduardo, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
