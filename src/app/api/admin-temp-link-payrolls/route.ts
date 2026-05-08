import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Iniciando vinculação de holerites existentes...")

    const payrolls = await prisma.payroll.findMany({
      where: {
        attendanceMirrorId: null,
      },
      include: {
        employee: true,
      },
    })

    const results = []
    let updatedCount = 0

    for (const payroll of payrolls) {
      // Resolve o período do espelho (mês anterior ao da folha)
      const [year, month] = payroll.referencePeriod.split("-").map(Number)
      const mirrorPeriod = month === 1 
        ? `${year - 1}-12` 
        : `${year}-${String(month - 1).padStart(2, '0')}`

      console.log(`Buscando espelho para ${payroll.employee.fullName}: Folha ${payroll.referencePeriod} -> Espelho ${mirrorPeriod}`)

      // Tenta encontrar o espelho aprovado para o funcionário no período do espelho
      const mirror = await prisma.attendanceMirror.findFirst({
        where: {
          employeeId: payroll.employeeId,
          period: mirrorPeriod,
          status: "APPROVED",
        },
      })

      if (mirror) {
        await prisma.payroll.update({
          where: { id: payroll.id },
          data: { attendanceMirrorId: mirror.id },
        })
        updatedCount++
        results.push(`Vinculado: ${payroll.employee.fullName} (Folha: ${payroll.referencePeriod} -> Espelho: ${mirrorPeriod})`)
      } else {
        // Tenta buscar no mesmo mês caso a lógica da empresa seja diferente
        const sameMonthMirror = await prisma.attendanceMirror.findFirst({
          where: {
            employeeId: payroll.employeeId,
            period: payroll.referencePeriod,
            status: "APPROVED",
          },
        })

        if (sameMonthMirror) {
          await prisma.payroll.update({
            where: { id: payroll.id },
            data: { attendanceMirrorId: sameMonthMirror.id },
          })
          updatedCount++
          results.push(`Vinculado (Mesmo Mês): ${payroll.employee.fullName} (${payroll.referencePeriod})`)
        }
      }
    }

    // Apagar documentos de holerite (PDFs)
    const deleteResult = await prisma.employeeDocument.deleteMany({
      where: {
        type: "PAYROLL",
      },
    })

    return NextResponse.json({
      message: "Cleanup completed",
      linked: updatedCount,
      deletedPdfs: deleteResult.count,
      details: results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
