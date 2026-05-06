import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:L3FNzJyWUfh%23.E%21@db.tqstaitdzyfyjjdrpven.supabase.co:5432/postgres"
    }
  }
})

async function main() {
  console.log('Atualizando funcionários...')

  const updatedEdgar = await prisma.employee.update({
    where: { id: 'cmotlju5q00039adb6t3ukusp' },
    data: { pointMachineId: '007' }
  })

  const updatedEduardo = await prisma.employee.update({
    where: { id: 'cmotljsjh00019adbcpo77u01' },
    data: { pointMachineId: '008' }
  })

  console.log('Atualização concluída!')
  console.log('Edgar:', updatedEdgar.fullName, '->', updatedEdgar.pointMachineId)
  console.log('Eduardo:', updatedEduardo.fullName, '->', updatedEduardo.pointMachineId)
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
