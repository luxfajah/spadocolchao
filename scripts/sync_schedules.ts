import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Sincronizando escalas oficiais...")

  // 1. CLT Comum 44h
  // Seg-Sex: 08:00-12:00 / 14:00-18:00 (8h)
  // Sáb: 08:00-12:00 (4h)
  // Total: 5x8 + 4 = 44h
  const cltSchedule = await prisma.workSchedule.upsert({
    where: { name: "CLT COMUM 44H (08-12 / 14-18)" },
    update: {
      weeklyHours: 44,
      mondayMinutes: 480,
      tuesdayMinutes: 480,
      wednesdayMinutes: 480,
      thursdayMinutes: 480,
      fridayMinutes: 480,
      saturdayMinutes: 240,
      expectedLunchMinutes: 120, // 12:00 às 14:00
      mondayIn1: "08:00", mondayOut1: "12:00", mondayIn2: "14:00", mondayOut2: "18:00",
      tuesdayIn1: "08:00", tuesdayOut1: "12:00", tuesdayIn2: "14:00", tuesdayOut2: "18:00",
      wednesdayIn1: "08:00", wednesdayOut1: "12:00", wednesdayIn2: "14:00", wednesdayOut2: "18:00",
      thursdayIn1: "08:00", thursdayOut1: "12:00", thursdayIn2: "14:00", thursdayOut2: "18:00",
      fridayIn1: "08:00", fridayOut1: "12:00", fridayIn2: "14:00", fridayOut2: "18:00",
      saturdayIn1: "08:00", saturdayOut1: "12:00", saturdayIn2: null, saturdayOut2: null,
    },
    create: {
      name: "CLT COMUM 44H (08-12 / 14-18)",
      weeklyHours: 44,
      mondayMinutes: 480,
      tuesdayMinutes: 480,
      wednesdayMinutes: 480,
      thursdayMinutes: 480,
      fridayMinutes: 480,
      saturdayMinutes: 240,
      expectedLunchMinutes: 120,
      mondayIn1: "08:00", mondayOut1: "12:00", mondayIn2: "14:00", mondayOut2: "18:00",
      tuesdayIn1: "08:00", tuesdayOut1: "12:00", tuesdayIn2: "14:00", tuesdayOut2: "18:00",
      wednesdayIn1: "08:00", wednesdayOut1: "12:00", wednesdayIn2: "14:00", wednesdayOut2: "18:00",
      thursdayIn1: "08:00", thursdayOut1: "12:00", thursdayIn2: "14:00", thursdayOut2: "18:00",
      fridayIn1: "08:00", fridayOut1: "12:00", fridayIn2: "14:00", fridayOut2: "18:00",
      saturdayIn1: "08:00", saturdayOut1: "12:00",
    }
  })
  console.log(`✅ Escala CLT criada/atualizada: ${cltSchedule.name}`)

  // 2. Menor Aprendiz 20h
  // Seg-Sex: 14:00-18:00 (4h)
  // Total: 5x4 = 20h
  const aprendizSchedule = await prisma.workSchedule.upsert({
    where: { name: "MENOR APRENDIZ 20H (14-18)" },
    update: {
      weeklyHours: 20,
      mondayMinutes: 240,
      tuesdayMinutes: 240,
      wednesdayMinutes: 240,
      thursdayMinutes: 240,
      fridayMinutes: 240,
      saturdayMinutes: 0,
      expectedLunchMinutes: 0,
      mondayIn1: "14:00", mondayOut1: "18:00",
      tuesdayIn1: "14:00", tuesdayOut1: "18:00",
      wednesdayIn1: "14:00", wednesdayOut1: "18:00",
      thursdayIn1: "14:00", thursdayOut1: "18:00",
      fridayIn1: "14:00", fridayOut1: "18:00",
    },
    create: {
      name: "MENOR APRENDIZ 20H (14-18)",
      weeklyHours: 20,
      mondayMinutes: 240,
      tuesdayMinutes: 240,
      wednesdayMinutes: 240,
      thursdayMinutes: 240,
      fridayMinutes: 240,
      saturdayMinutes: 0,
      expectedLunchMinutes: 0,
      mondayIn1: "14:00", mondayOut1: "18:00",
      tuesdayIn1: "14:00", tuesdayOut1: "18:00",
      wednesdayIn1: "14:00", wednesdayOut1: "18:00",
      thursdayIn1: "14:00", thursdayOut1: "18:00",
      fridayIn1: "14:00", fridayOut1: "18:00",
    }
  })
  console.log(`✅ Escala Aprendiz criada/atualizada: ${aprendizSchedule.name}`)

  console.log("\n✨ Escalas sincronizadas com sucesso!")
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
