import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { isAttendanceAdmin } from "@/lib/attendance/auth"

export async function GET() {
  try {
    // Permission check (using the same as attendance for now as it covers HR/Admin)
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    const lastEmp = await (prisma as any).employee.findFirst({
      orderBy: { serialId: 'desc' },
      where: { NOT: { serialId: null } }
    })

    const nextId = (lastEmp?.serialId || 0) + 1

    return NextResponse.json({ nextId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
