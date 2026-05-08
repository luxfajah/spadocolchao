import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const employees = await prisma.employee.findMany({
    where: {
      fullName: {
        contains: 'Daniel Santi',
        mode: 'insensitive'
      }
    }
  })

  if (employees.length === 0) {
    console.log("Nenhum funcionário com o nome 'Daniel Santi' encontrado.")
    return
  }

  for (const emp of employees) {
    console.log(`Atualizando funcionário ${emp.fullName} (ID: ${emp.id}) - foodAllowance atual: ${emp.foodAllowance}`)
    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        foodAllowance: 0
      }
    })
    console.log(`foodAllowance zerado para ${emp.fullName}.`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
