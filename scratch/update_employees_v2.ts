import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:L3FNzJyWUfh%23.E%21@db.tqstaitdzyfyjjdrpven.supabase.co:5432/postgres"
    }
  }
})

async function main() {
  console.log('Atualizando serialId e pointMachineId...')

  const updatedEdgar = await prisma.employee.update({
    where: { id: 'cmotlju5q00039adb6t3ukusp' },
    data: { 
      serialId: 7,
      pointMachineId: '007',
      code: '007' // Also setting code just in case
    }
  })

  const updatedEduardo = await prisma.employee.update({
    where: { id: 'cmotljsjh00019adbcpo77u01' },
    data: { 
      serialId: 8,
      pointMachineId: '008',
      code: '008'
    }
  })

  console.log('Atualização concluída!')
  console.log('Edgar:', updatedEdgar.fullName, '| Serial:', updatedEdgar.serialId, '| Point:', updatedEdgar.pointMachineId)
  console.log('Eduardo:', updatedEduardo.fullName, '| Serial:', updatedEduardo.serialId, '| Point:', updatedEduardo.pointMachineId)
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
