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

    const mirrorsWithNames = await prisma.attendanceMirror.findMany({
      select: { employee: { select: { fullName: true } } },
      distinct: ["employeeId"]
    })

    return NextResponse.json({
      unlinked: unlinked.map(p => p.employee.fullName),
      employeesWithMirrors: mirrorsWithNames.map(m => m.employee.fullName)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
