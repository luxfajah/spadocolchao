import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const payrolls = await prisma.payroll.findMany({
      take: 10,
      select: {
        id: true,
        employeeId: true,
        referencePeriod: true,
        attendanceMirrorId: true,
        employee: { select: { fullName: true } }
      }
    })

    const mirrors = await prisma.attendanceMirror.findMany({
      take: 10,
      select: {
        id: true,
        employeeId: true,
        period: true,
        status: true,
        employee: { select: { fullName: true } }
      }
    })

    return NextResponse.json({
      payrolls,
      mirrors
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
