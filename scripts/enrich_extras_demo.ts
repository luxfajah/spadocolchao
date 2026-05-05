import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- [START] Enriching Marital Status & Emergency Contact ---')

  const employees = await (prisma as any).employee.findMany({ 
    where: { serialId: { gte: 1, lte: 12 } }
  })

  const MARITAL_STATUSES = ['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO']
  const EMERGENCY_NAMES = ['Helena Maria Silva', 'João Ricardo Pereira', 'Ana Paula dos Santos', 'Carlos Roberto Lima']

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    
    await (prisma as any).employee.update({
      where: { id: emp.id },
      data: {
        maritalStatus: MARITAL_STATUSES[Math.floor(Math.random() * MARITAL_STATUSES.length)],
        emergencyContactName: EMERGENCY_NAMES[i % EMERGENCY_NAMES.length],
        emergencyContactPhone: `(11) 9${Math.floor(6000 + Math.random() * 3000)}-${Math.floor(1000 + Math.random() * 8000)}`,
      }
    })

    console.log(`  - Updated: ${emp.fullName}`)
  }

  console.log('--- [DONE] Enriching Marital Status & Emergency Contact ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
