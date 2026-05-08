import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const payrolls = await (prisma as any).payroll.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      referencePeriod: true,
      attendanceMirrorId: true,
      employee: { select: { fullName: true } }
    }
  })

  const mirrors = await (prisma as any).attendanceMirror.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      period: true,
      status: true,
      employee: { select: { fullName: true } }
    }
  })

  return NextResponse.json({ payrolls, mirrors })
}
