import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const payrolls = await prisma.payroll.findMany({
      select: {
        id: true,
        employeeId: true,
        referencePeriod: true,
        notes: true,
        attendanceMirrorId: true,
        employee: {
          select: { fullName: true }
        }
      }
    })

    const mirrors = await prisma.attendanceMirror.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        employeeId: true,
        period: true,
        employee: {
          select: { fullName: true }
        }
      }
    })

    const payrollsWithoutLink = payrolls.filter(p => !p.attendanceMirrorId)

    return NextResponse.json({
      payrollsTotal: payrolls.length,
      mirrorsTotal: mirrors.length,
      payrollsWithoutLink: payrollsWithoutLink.map(p => ({
        id: p.id,
        employee: p.employee.fullName,
        period: p.referencePeriod,
        notes: p.notes,
        mirrorMatches: mirrors.filter(m => m.employeeId === p.employeeId && m.period === p.referencePeriod).map(m => m.id)
      })),
      allMirrors: mirrors.map(m => ({
        id: m.id,
        employee: m.employee.fullName,
        period: m.period
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
