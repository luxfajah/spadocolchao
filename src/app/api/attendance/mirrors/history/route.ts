import { NextResponse } from "next/server"
import { getMirrorsHistory } from "@/lib/attendance/service"
import { isAttendanceAdmin } from "@/lib/attendance/auth"

export async function GET() {
  try {
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    const history = await getMirrorsHistory()
    return NextResponse.json(history)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
