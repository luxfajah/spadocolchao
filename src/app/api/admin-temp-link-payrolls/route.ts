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
        results.push(`Vinculado: ${payroll.employee.fullName} (${payroll.referencePeriod})`)
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
