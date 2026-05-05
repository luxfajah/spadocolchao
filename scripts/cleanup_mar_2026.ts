import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Iniciando limpeza de dados de Março/2026...")

  try {
    // 1. Deletar AttendanceDay (Março/2026)
    const deletedDays = await prisma.attendanceDay.deleteMany({
      where: {
        date: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
          lte: new Date("2026-03-31T23:59:59.999Z"),
        },
      },
    })
    console.log(`✅ ${deletedDays.count} registros de AttendanceDay removidos.`)

    // 2. Deletar TimePunch (Março/2026)
    const deletedPunches = await prisma.timePunch.deleteMany({
      where: {
        punchDateTime: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
          lte: new Date("2026-03-31T23:59:59.999Z"),
        },
      },
    })
    console.log(`✅ ${deletedPunches.count} batidas de ponto (TimePunch) removidas.`)

    // 3. Deletar AttendanceMirror (Período "2026-03")
    const deletedMirrors = await prisma.attendanceMirror.deleteMany({
      where: {
        OR: [
          { period: "2026-03" },
          { period: { contains: "Março de 2026" } }
        ]
      },
    })
    console.log(`✅ ${deletedMirrors.count} espelhos de ponto (AttendanceMirror) removidos.`)

    console.log("\n✨ Limpeza concluída com sucesso! O sistema está pronto para receber os dados reais.")
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
