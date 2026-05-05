import { PrismaClient } from '@prisma/client'
import { generateMirror } from '../src/lib/attendance/service'

const prisma = new PrismaClient()

const FACTORY_JOBS = [
  { name: 'Montador de Estofados', dept: 'Produção' },
  { name: 'Costureira Industrial', dept: 'Produção' },
  { name: 'Tapeceiro de Colchão', dept: 'Produção' },
  { name: 'Operador de Máquina de Espuma', dept: 'Produção' },
  { name: 'Auxiliar de Produção', dept: 'Produção' },
  { name: 'Conferente de Expedição', dept: 'Logística' },
  { name: 'Motorista (Logística)', dept: 'Logística' },
  { name: 'Auxiliar Administrativo', dept: 'Administrativo' },
  { name: 'Analista Financeiro', dept: 'Administrativo' },
  { name: 'Gerente de Produção', dept: 'Produção' }
]

const FAKE_NAMES = [
  'Carlos Alberto da Silva',
  'Ana Beatriz de Oliveira',
  'Ricardo Mendes Pereira',
  'Juliana Costa dos Santos',
  'Marcos Vinicius de Souza',
  'Fernanda Rocha Lima',
  'Tiago Henrique Ferreira',
  'Camila Alves Martins',
  'Gabriel Antunes Costa',
  'Larissa Oliveira Melo'
]

async function main() {
  console.log('--- [START] Factory Demo Generation ---')

  // 1. Cleanup
  console.log('Cleaning up all attendance and employee data...')
  await (prisma as any).attendanceDay.deleteMany({})
  await (prisma as any).attendanceMirror.deleteMany({})
  await (prisma as any).timePunch.deleteMany({})
  await (prisma as any).timePunchImport.deleteMany({})
  await (prisma as any).punchRecord.deleteMany({})
  await (prisma as any).employee.deleteMany({})
  await (prisma as any).jobTitle.deleteMany({})
  console.log('Cleanup complete.')

  // 2. Job Titles
  console.log('Creating Factory Job Titles...')
  const jobMap = new Map()
  for (const job of FACTORY_JOBS) {
    const jt = await (prisma as any).jobTitle.create({
      data: { name: job.name, department: job.dept }
    })
    jobMap.set(job.name, jt.id)
  }

  // 3. Infrastructure (WorkSchedule)
  console.log('Ensuring WorkSchedule...')
  const schedule = await (prisma as any).workSchedule.upsert({
    where: { name: 'Escala de Fábrica 44h' },
    update: {},
    create: {
      name: 'Escala de Fábrica 44h',
      weeklyHours: 44,
      mondayMinutes: 480, tuesdayMinutes: 480, wednesdayMinutes: 480, thursdayMinutes: 480, fridayMinutes: 480, 
      saturdayMinutes: 240, sundayMinutes: 0, expectedLunchMinutes: 60,
      mondayIn1: '08:00', mondayOut1: '12:00', mondayIn2: '13:00', mondayOut2: '17:48',
      tuesdayIn1: '08:00', tuesdayOut1: '12:00', tuesdayIn2: '13:00', tuesdayOut2: '17:48',
      wednesdayIn1: '08:00', wednesdayOut1: '12:00', wednesdayIn2: '13:00', wednesdayOut2: '17:48',
      thursdayIn1: '08:00', thursdayOut1: '12:00', thursdayIn2: '13:00', thursdayOut2: '17:48',
      fridayIn1: '08:00', fridayOut1: '12:00', fridayIn2: '13:00', fridayOut2: '17:48',
      saturdayIn1: '08:00', saturdayOut1: '12:00',
    }
  })

  // 4. Employees (Serial 01 to 10)
  console.log('Generating 10 Employees (Serial 01-10)...')
  const createdEmployees = []
  for (let i = 0; i < 10; i++) {
    const serialId = i + 1
    const job = FACTORY_JOBS[i]
    const emp = await (prisma as any).employee.create({
      data: {
        serialId,
        fullName: FAKE_NAMES[i],
        contractType: 'CLT',
        status: 'ACTIVE',
        workScheduleId: schedule.id,
        jobTitleId: jobMap.get(job.name),
        department: job.dept,
        pointMachineId: serialId.toString()
      }
    })
    createdEmployees.push(emp)
  }

  // 5. Punches & Mirrors (March 2026)
  const year = 2026
  const month = 2
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const dummyImport = await (prisma as any).timePunchImport.create({
    data: { fileName: 'DEMO_FABRICA_PONTO.txt', recordsCount: 1000, status: 'COMPLETED' }
  })

  console.log('Generating Attendance Data...')
  for (const emp of createdEmployees) {
    const punchData: any[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      if (date.getDay() === 0) continue

      const vary = () => Math.floor(Math.random() * 11) - 5
      const addPunch = (h: number, m: number) => {
        punchData.push({
          importId: dummyImport.id,
          employeeId: emp.id,
          enNo: emp.pointMachineId,
          punchDateTime: new Date(year, month, d, h, m + vary()),
          type: 'CLOCK_EVENT',
          rawType: 'S',
          isNormalized: false
        })
      }

      addPunch(8, 0)
      if (date.getDay() !== 6) {
        addPunch(12, 0)
        addPunch(13, 0)
        addPunch(17, 48)
      } else {
        addPunch(12, 0)
      }
    }

    await (prisma as any).timePunch.createMany({ data: punchData })
    
    try {
      const start = new Date(year, month, 1)
      const end = new Date(year, month, daysInMonth, 23, 59, 59)
      await generateMirror(emp.id, start, end, 'Março de 2026')
      console.log(`  - Processed: ${emp.fullName} (${emp.serialId})`)
    } catch (e: any) {
      console.error(`  - Error ${emp.fullName}: ${e.message}`)
    }
  }

  console.log('--- [DONE] Factory Demo Generation ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
