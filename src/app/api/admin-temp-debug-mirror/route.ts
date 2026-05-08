import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  // Get most recent payrolls with their notes and mirror reference
  const payrolls = await (prisma as any).payroll.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      referencePeriod: true,
      notes: true,
      attendanceMirrorId: true,
      employee: { select: { fullName: true } }
    }
  })

  // Get most recent approved mirrors
  const mirrors = await (prisma as any).attendanceMirror.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      period: true,
      status: true,
      employeeId: true,
      overtimeMinutes: true,
      employee: { select: { fullName: true } }
    }
  })

  return NextResponse.json({ payrolls, mirrors })
}
