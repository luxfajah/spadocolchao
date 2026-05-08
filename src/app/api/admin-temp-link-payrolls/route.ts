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
      
      const mirrorPeriods = [
        month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`,
        payrollPeriod
      ]

      const mirror = await prisma.attendanceMirror.findFirst({
        where: {
          employeeId: payroll.employeeId,
          period: { in: mirrorPeriods },
        },
      })

      if (mirror) {
        await prisma.payroll.update({
          where: { id: payroll.id },
          data: { attendanceMirrorId: mirror.id },
        })
        updatedCount++
        results.push(`Vinculado: ${payroll.employee.fullName} (${payroll.referencePeriod}) -> Mirror ${mirror.period}`)
      }
    }

    // Caso especial para Anderson se não foi vinculado acima
    const andersonId = "cmotljvrx00059adbedyrve86"
    const andersonPayroll = await prisma.payroll.findFirst({
      where: { employeeId: andersonId, attendanceMirrorId: null }
    })

    if (andersonPayroll) {
       const andersonMirror = await prisma.attendanceMirror.findFirst({
         where: { employeeId: andersonId }
       })
       if (andersonMirror) {
         await prisma.payroll.update({
           where: { id: andersonPayroll.id },
           data: { attendanceMirrorId: andersonMirror.id }
         })
         updatedCount++
         results.push(`Vinculado Anderson manualmente: -> Mirror ${andersonMirror.period}`)
       }
    }

    // Apagar documentos de holerite (PDFs)
    const deleteResult = await prisma.employeeDocument.deleteMany({
      where: {
        type: "PAYROLL",
      },
    })

    const allMirrors = await prisma.attendanceMirror.findMany({
      include: { employee: true }
    })

    const unlinked = await prisma.payroll.findMany({
      where: { attendanceMirrorId: null },
      include: { employee: true }
    })

    return NextResponse.json({
      message: "Diagnostics",
      unlinked: unlinked.map(p => ({
        payrollId: p.id,
        employeeName: p.employee.fullName,
        employeeId: p.employeeId,
        period: p.referencePeriod
      })),
      mirrors: allMirrors.map(m => ({
        mirrorId: m.id,
        employeeName: m.employee.fullName,
        employeeId: m.employeeId,
        period: m.period,
        status: m.status
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
