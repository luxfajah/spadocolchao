import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const unlinkedCount = await prisma.payroll.count({
      where: { attendanceMirrorId: null }
    })

    const payrolls = await prisma.payroll.findMany({
      where: { attendanceMirrorId: null },
      include: { employee: true }
    })

    const mirrors = await prisma.attendanceMirror.findMany({
      include: { employee: true }
    })

    return NextResponse.json({
      unlinkedCount,
      unlinkedList: payrolls.map(p => ({ id: p.id, name: p.employee.fullName })),
      mirrors: mirrors.map(m => ({ id: m.id, name: m.employee.fullName, period: m.period }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
}
