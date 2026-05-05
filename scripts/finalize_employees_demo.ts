import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- [START] Finalizing Financial & Operational Data ---')

  const employees = await (prisma as any).employee.findMany({ 
    where: { serialId: { gte: 1, lte: 12 } },
    include: { jobTitle: true }
  })

  const SOCIAL_NAMES = ['Ana Luíza', 'Rafael Mendes', 'Mário Gabriel']
  const BANKS = ['Itaú Unibanco', 'Banco Bradesco', 'Banco Santander', 'Nubank', 'Banco Inter']

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const jobName = emp.jobTitle?.name || ''
    
    // 1. Determine Salary based on Role
    let salary = 1950.00
    if (jobName === 'Gerente de Produção') salary = 5800.00
    if (jobName === 'Analista Financeiro') salary = 3400.00
    if (jobName === 'Auxiliar Administrativo') salary = 2100.00
    if (jobName === 'Montador de Estofados') salary = 2300.00
    if (emp.contractType === 'Aprendiz') salary = 950.00

    // 2. Email generation
    const cleanName = emp.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ')
    const email = `${cleanName[0]}.${cleanName[cleanName.length - 1]}@spacolchao.com.br`

    // 3. Address
    const neighborhoods = ['Vila Mariana', 'Mooca', 'Santana', 'Butantã', 'Pinheiros', 'Tatuapé', 'Ipiranga']
    const neighborhood = neighborhoods[i % neighborhoods.length]

    // 4. Update
    await (prisma as any).employee.update({
      where: { id: emp.id },
      data: {
        admissionDate: new Date(2026, 0, 1), // 01/01/2026
        salaryBase: salary,
        email: email,
        socialName: i < 3 ? SOCIAL_NAMES[i] : null, // Set 3 social names
        nationality: 'Brasileira',
        street: 'Avenida Tiradentes',
        number: (100 * (i + 1)).toString(),
        neighborhood: neighborhood,
        city: 'São Paulo',
        state: 'SP',
        
        // Benefits
        foodAllowance: 650.00,
        transportationAllowance: 220.00,
        vtDailyValue: 10.00,
        vtWorkDaysPerMonth: 22,
        healthPlan: true,
        healthPlanDetails: 'Plano Bradesco Saúde Top Nacional',
        dentalPlan: true,
        lifeInsurance: true,
        attendanceBonusEnabled: true,
        attendanceBonusAmount: 150.00,
        
        // Banking
        bankName: BANKS[i % BANKS.length],
        bankBranch: `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(0 + Math.random() * 9)}`,
        bankAccount: `${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(0 + Math.random() * 9)}`,
        bankAccountType: 'CORRENTE',
        pixKeyType: 'CPF',
        pixKey: emp.cpf?.replace(/\./g, '').replace(/-/g, ''),
      }
    })

    console.log(`  - Finalized: ${emp.fullName} (Salary: R$ ${salary.toFixed(2)})`)
  }

  console.log('--- [DONE] Finalizing Financial & Operational Data ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })
