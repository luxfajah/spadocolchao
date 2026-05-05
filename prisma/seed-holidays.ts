import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding holidays for Foz do Iguaçu...')

  const holidays = [
    // Nacionais Fixos
    { date: '2024-01-01', name: 'Confraternização Universal (Ano Novo)', type: 'NATIONAL' },
    { date: '2024-04-21', name: 'Tiradentes', type: 'NATIONAL' },
    { date: '2024-05-01', name: 'Dia do Trabalho', type: 'NATIONAL' },
    { date: '2024-09-07', name: 'Independência do Brasil', type: 'NATIONAL' },
    { date: '2024-10-12', name: 'Nossa Sra. Aparecida', type: 'NATIONAL' },
    { date: '2024-11-02', name: 'Finados', type: 'NATIONAL' },
    { date: '2024-11-15', name: 'Proclamação da República', type: 'NATIONAL' },
    { date: '2024-12-25', name: 'Natal', type: 'NATIONAL' },
    
    // Municipais Foz do Iguaçu
    { date: '2024-06-10', name: 'Aniversário de Foz do Iguaçu', type: 'MUNICIPAL' },
    { date: '2024-06-24', name: 'Padroeiro de Foz (São João)', type: 'MUNICIPAL' },

    // Móveis 2024
    { date: '2024-02-13', name: 'Carnaval', type: 'MOVEABLE' },
    { date: '2024-03-29', name: 'Sexta-feira Santa', type: 'MOVEABLE' },
    { date: '2024-05-30', name: 'Corpus Christi', type: 'MOVEABLE' },

    // 2025
    { date: '2025-01-01', name: 'Confraternização Universal', type: 'NATIONAL' },
    { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'MOVEABLE' },
    { date: '2025-04-21', name: 'Tiradentes', type: 'NATIONAL' },
    { date: '2025-05-01', name: 'Dia do Trabalho', type: 'NATIONAL' },
    { date: '2025-06-19', name: 'Corpus Christi', type: 'MOVEABLE' },
    { date: '2025-12-25', name: 'Natal', type: 'NATIONAL' },
  ]

  for (const h of holidays) {
    await prisma.companyHoliday.upsert({
      where: {
        date_name: {
          date: new Date(h.date + 'T00:00:00Z'),
          name: h.name
        }
      },
      update: {},
      create: {
        date: new Date(h.date + 'T00:00:00Z'),
        name: h.name,
        type: h.type,
        closesCommerce: true
      }
    })
  }

  console.log('Holidays seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
