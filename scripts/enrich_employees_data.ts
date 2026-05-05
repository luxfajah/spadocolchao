import { PrismaClient } from '@prisma/client'
import { generateMirror } from '../src/lib/attendance/service'

const prisma = new PrismaClient()

async function main() {
  console.log('--- [START] Enriching Employee Data ---')

  const schedule = await (prisma as any).workSchedule.findFirst({ where: { name: 'Escala de Fábrica 44h' } })
  const jobs = await (prisma as any).jobTitle.findMany()
  const jobMap = new Map(jobs.map((j: any) => [j.name, j.id]))

  // 1. Update Existing 10 (Serial 1-10)
  const existing = await (prisma as any).employee.findMany({ where: { serialId: { gte: 1, lte: 10 } } })
  
  for (const emp of existing) {
    await (prisma as any).employee.update({
      where: { id: emp.id },
      data: {
        cpf: `${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
        rg: `${Math.floor(10 + Math.random() * 80)}.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}-${Math.floor(0 + Math.random() * 9)}`,
        pis: `${Math.floor(100 + Math.random() * 900)}.${Math.floor(10000 + Math.random() * 90000)}.${Math.floor(10 + Math.random() * 90)}.${Math.floor(0 + Math.random() * 9)}`,
        birthDate: new Date(1980 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        motherName: 'Maria Helena ' + emp.fullName.split(' ').pop(),
        fatherName: 'João Carlos ' + emp.fullName.split(' ').pop(),
        address: 'Rua Principal, ' + (100 + emp.serialId),
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        phone: '(11) 9' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000),
      }
    })
    
    // Add 5 Documents
    const docTypes = [
      { type: 'CONTRACT', name: 'Contrato de Trabalho' },
      { type: 'REGISTRATION_FORM', name: 'Ficha de Registro Cadastral' },
      { type: 'OTHER', name: 'Cópia do RG e CPF' },
      { type: 'OTHER', name: 'Comprovante de Residência' },
      { type: 'OTHER', name: 'Carteira de Vacinação' }
    ]
    
    for (const doc of docTypes) {
      await (prisma as any).employeeDocument.create({
        data: {
          employeeId: emp.id,
          type: doc.type,
          name: doc.name,
          description: 'Documento gerado automaticamente para demonstração.',
          fileUrl: `/uploads/docs/${emp.id}_${doc.type.toLowerCase()}.pdf`
        }
      })
    }
    console.log(`  - Enriched & Docs for: ${emp.fullName}`)
  }

  // 2. Add 2 Menores Aprendizes (IDs 11 & 12)
  console.log('Adding 2 Menores Aprendizes...')
  const minors = [
    { name: 'Gabriel Silva Santos', job: 'Auxiliar de Produção', serial: 11, dept: 'Produção', school: 'Escola Estadual Prof. Alberto' },
    { name: 'Lucas Ferreira Lima', job: 'Auxiliar Administrativo', serial: 12, dept: 'Administrativo', school: 'Colégio Militar de SP' }
  ]

  const year = 2026
  const month = 2
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dummyImport = await (prisma as any).timePunchImport.findFirst({ where: { fileName: 'DEMO_FABRICA_PONTO.txt' } })

  for (const min of minors) {
    const emp = await (prisma as any).employee.create({
      data: {
        serialId: min.serial,
        fullName: min.name,
        contractType: 'Aprendiz',
        status: 'ACTIVE',
        workScheduleId: schedule?.id,
        jobTitleId: jobMap.get(min.job),
        department: min.dept,
        pointMachineId: min.serial.toString(),
        schoolName: min.school,
        schoolShift: min.dept === 'Produção' ? 'NOTURNO' : 'VESPERTINO',
        technicalCourse: min.dept === 'Produção' ? 'Mecânica Industrial' : 'Gestão Empresarial',
        apprenticeshipEnd: new Date(2027, 11, 20),
        cpf: `444.333.222-${10 + min.serial}`,
        rg: `55.444.333-${min.serial}`,
        birthDate: new Date(2008 + Math.floor(Math.random() * 2), 5, 10),
        motherName: 'Francisca ' + min.name.split(' ').pop(),
        address: 'Av. das Flores, ' + (50 * min.serial),
        city: 'São Paulo', state: 'SP'
      }
    })

    // Documents
    await (prisma as any).employeeDocument.createMany({
      data: [
        { employeeId: emp.id, type: 'CONTRACT', name: 'Contrato de Aprendizagem', fileUrl: 'dummy.pdf' },
        { employeeId: emp.id, type: 'OTHER', name: 'Declaração Escolar', fileUrl: 'dummy.pdf' },
        { employeeId: emp.id, type: 'OTHER', name: 'Autorização Pais', fileUrl: 'dummy.pdf' }
      ]
    })

    // Attendance (March 2026)
    const punchData: any[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      if (date.getDay() === 0 || date.getDay() === 6) continue // Apprentices don't work weekends usually

      const vary = () => Math.floor(Math.random() * 7) - 3
      const addPunch = (h: number, m: number) => {
        punchData.push({
          importId: dummyImport?.id,
          employeeId: emp.id,
          enNo: emp.pointMachineId,
          punchDateTime: new Date(year, month, d, h, m + vary()),
          type: 'CLOCK_EVENT', rawType: 'S', isNormalized: false
        })
      }
      
      // Apprentices might work 6h (08:00 - 14:00 with 15m interval)
      addPunch(8, 0)
      addPunch(14, 0)
    }
    await (prisma as any).timePunch.createMany({ data: punchData })
    await generateMirror(emp.id, new Date(year, month, 1), new Date(year, month, daysInMonth, 23, 59, 59), 'Março de 2026')
    
    console.log(`  - Created & Processed: ${emp.fullName} (Minor)`)
  }

  console.log('--- [DONE] Enriching Employee Data ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
