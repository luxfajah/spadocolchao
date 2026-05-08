import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: { id: true, fullName: true }
    })

    const mirrors = await prisma.attendanceMirror.findMany({
      select: { id: true, employeeId: true, period: true, status: true }
    })

    const payrolls = await prisma.payroll.findMany({
      where: { attendanceMirrorId: null },
      select: { id: true, employeeId: true, referencePeriod: true }
    })

    return NextResponse.json({
      employees,
      mirrors,
      unlinkedPayrolls: payrolls
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
