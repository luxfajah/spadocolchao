import { NextRequest, NextResponse } from "next/server"
import { getEmployeeAttendanceCalendarMonth } from "@/lib/attendance/service"
import { isAttendanceAdmin } from "@/lib/attendance/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    const { employeeId } = params
    const q = req.nextUrl.searchParams
    const year = parseInt(q.get("year") || new Date().getFullYear().toString())
    const month = parseInt(q.get("month") || (new Date().getMonth() + 1).toString())

    const days = await getEmployeeAttendanceCalendarMonth(employeeId, year, month)
    return NextResponse.json(days)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
