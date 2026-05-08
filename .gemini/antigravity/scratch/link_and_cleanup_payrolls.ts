import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando vinculação de holerites existentes...")

  const payrolls = await prisma.payroll.findMany({
    where: {
      attendanceMirrorId: null,
    },
    include: {
      employee: true,
    },
  })

  console.log(`Encontrados ${payrolls.length} holerites sem vínculo direto.`)

  let updatedCount = 0

  for (const payroll of payrolls) {
    // Tenta encontrar o espelho aprovado para o funcionário no período
    const mirror = await prisma.attendanceMirror.findFirst({
      where: {
        employeeId: payroll.employeeId,
        period: payroll.referencePeriod,
        status: "APPROVED",
      },
    })

    if (mirror) {
      await prisma.payroll.update({
        where: { id: payroll.id },
        data: { attendanceMirrorId: mirror.id },
      })
      updatedCount++
      console.log(`Vinculado: Funcionario ${payroll.employee.fullName} | Período ${payroll.referencePeriod}`)
    } else {
      console.log(`Não encontrado espelho aprovado para: ${payroll.employee.fullName} | ${payroll.referencePeriod}`)
    }
  }

  console.log(`Total de holerites vinculados: ${updatedCount}`)

  // Agora vamos apagar os documentos de holerite (PDFs) para forçar a regeração
  console.log("Apagando registros de documentos de holerite (PDFs)...")
  const deleteResult = await prisma.employeeDocument.deleteMany({
    where: {
      type: "PAYROLL",
    },
  })

  console.log(`Apagados ${deleteResult.count} registros de documentos de holerite.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
