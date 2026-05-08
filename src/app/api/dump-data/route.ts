import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

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
      },
      orderBy: { createdAt: 'desc' }
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      payrolls,
      mirrors
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
