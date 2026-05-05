const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const tpImports = await prisma.timePunchImport.findMany({ take: 5 })
  const tpPunches = await prisma.timePunch.count()
  const tpPunchesUnmatched = await prisma.timePunch.count({ where: { employeeId: null } })
  
  const mirrors = await prisma.attendanceMirror.count()
  const days = await prisma.attendanceDay.count()

  console.log('--- Advanced Point ---')
  console.log('TimePunchImports:', tpImports.length)
  console.log('Total TimePunches:', tpPunches)
  console.log('Unmatched TimePunches:', tpPunchesUnmatched)
  
  console.log('--- Processed Data ---')
  console.log('AttendanceMirrors:', mirrors)
  console.log('AttendanceDays:', days)

  if (tpPunches > 0) {
    const sample = await prisma.timePunch.findMany({ take: 3 })
    console.log('Sample Punches:', JSON.stringify(sample, null, 2))
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
