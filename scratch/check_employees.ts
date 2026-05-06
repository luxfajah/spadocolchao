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
    where: {
      id: { in: ['cmotlju5q00039adb6t3ukusp', 'cmotljsjh00019adbcpo77u01'] }
    },
    select: {
      id: true,
      fullName: true,
      serialId: true,
      code: true,
      pointMachineId: true
    }
  })

  console.log('--- Estado Atual dos Funcionários ---')
  console.log(JSON.stringify(employees, null, 2))
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
