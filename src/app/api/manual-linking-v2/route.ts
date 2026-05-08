import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const unlinked = await prisma.payroll.findMany({
      where: { attendanceMirrorId: null },
      include: { employee: true }
    })

    const mirrors = await prisma.attendanceMirror.findMany({
      select: { id: true, employeeId: true, period: true, status: true, employee: { select: { fullName: true } } }
    })

    return NextResponse.json({
      unlinkedCount: unlinked.length,
      unlinked: unlinked.map(p => ({
        payrollId: p.id,
        employeeName: p.employee.fullName,
        employeeId: p.employeeId,
        period: p.referencePeriod
      })),
      mirrors: mirrors.map(m => ({
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
