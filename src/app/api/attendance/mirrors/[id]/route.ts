import { NextRequest, NextResponse } from "next/server"
import { getMirrorById } from "@/lib/attendance/service"
import { isAttendanceAdmin } from "@/lib/attendance/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    const id = params.id
    if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 })

    const mirror = await getMirrorById(id)
    if (!mirror) return NextResponse.json({ error: "Espelho não encontrado" }, { status: 404 })

    return NextResponse.json(mirror)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
