const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const unmatched = await prisma.punchRecord.findMany({
    where: { employeeId: null },
    take: 5
  })

  const total = await prisma.punchRecord.count()
  const totalUnmatched = await prisma.punchRecord.count({ where: { employeeId: null } })
  const employees = await prisma.employee.findMany({ select: { id: true, fullName: true, pis: true, serialId: true }, take: 5 })

  console.log('Total Records:', total)
  console.log('Unmatched Records:', totalUnmatched)
  console.log('Sample Unmatched:', JSON.stringify(unmatched, null, 2))
  console.log('Sample Employees:', JSON.stringify(employees, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
