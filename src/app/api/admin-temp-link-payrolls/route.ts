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
      const payrollPeriod = payroll.referencePeriod
      const [year, month] = payrollPeriod.split("-").map(Number)
      
      // Tenta o mês anterior e o mês atual (caso a empresa use competência do próprio mês)
      const mirrorPeriods = [
        month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`,
        payrollPeriod
      ]

      const mirror = await prisma.attendanceMirror.findFirst({
        where: {
          employeeId: payroll.employeeId,
          period: { in: mirrorPeriods },
          // Removendo a trava de status: "APPROVED" para ver se encontramos algo
        },
      })

      if (mirror) {
        await prisma.payroll.update({
          where: { id: payroll.id },
          data: { attendanceMirrorId: mirror.id },
        })
        updatedCount++
        results.push(`Vinculado: ${payroll.employee.fullName} (${payroll.referencePeriod}) -> Mirror ${mirror.period} (${mirror.status})`)
      }
    }

    // Apagar documentos de holerite (PDFs)
    const deleteResult = await prisma.employeeDocument.deleteMany({
      where: {
        type: "PAYROLL",
      },
    })

    const allMirrors = await prisma.attendanceMirror.findMany({
      select: { id: true, employeeId: true, period: true, status: true }
    })

    return NextResponse.json({
      message: "Diagnostics and link attempt completed",
      linked: updatedCount,
      deletedPdfs: deleteResult.count,
      unlinkedPayrollsRemaining: (await prisma.payroll.findMany({
        where: { attendanceMirrorId: null },
        include: { employee: true }
      })).map(p => ({
        id: p.id,
        employee: p.employee.fullName,
        employeeId: p.employeeId,
        period: p.referencePeriod,
        notes: p.notes
      })),
      details: results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
