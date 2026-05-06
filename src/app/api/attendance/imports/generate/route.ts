import { NextRequest, NextResponse } from "next/server"
import { parsePunchTxt } from "@/lib/attendance/parser"
import { importRawPunches, generateMirror } from "@/lib/attendance/service"
import { prisma } from "@/lib/prisma"
import { isAttendanceAdmin } from "@/lib/attendance/auth"
import { buildAttendancePeriodKey } from "@/lib/attendance/period"

export async function POST(req: NextRequest) {
  try {
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    const formData = await req.formData()
    const file = formData.get("file") as File
    const selectedPointIds = JSON.parse(formData.get("selectedPointIds") as string)
    const startDateStr = formData.get("startDate") as string
    const endDateStr = formData.get("endDate") as string
    if (!file || !selectedPointIds || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Parâmetros ausentes." }, { status: 400 })
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    const periodKey = buildAttendancePeriodKey(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1)

    const buffer = Buffer.from(await file.arrayBuffer())
    const raw = parsePunchTxt(buffer)

    // 1. Importação bruta de todos os registros (Audit Trail)
    const batch = await importRawPunches(file.name, raw)

    // 2. Mapeamento de selecionados para IDs do banco de forma flexível
    const allEmployees = await (prisma as any).employee.findMany({
      where: { 
        OR: [
          { pointMachineId: { not: null } },
          { serialId: { not: null } }
        ]
      },
      select: { id: true, pointMachineId: true, serialId: true },
    })

    const empLookup = new Map()
    allEmployees.forEach((e: any) => {
      if (e.pointMachineId) {
        empLookup.set(e.pointMachineId, e)
        const norm = e.pointMachineId.replace(/^0+/, '')
        if (norm) empLookup.set(norm, e)
      }
      if (e.serialId) {
        empLookup.set(e.serialId.toString(), e)
      }
    })

    const targetEmployees = (selectedPointIds as string[])
      .map(id => empLookup.get(id))
      .filter(Boolean)

    // 3. Geração de Espelhos e AttendanceDays
    const results = []
    for (const emp of targetEmployees) {
      try {
        const mirror = await generateMirror(emp.id, startDate, endDate, periodKey)
        results.push({ id: emp.id, mirrorId: mirror.id, success: true })
      } catch (err: any) {
        results.push({ id: emp.id, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalGenerated: results.filter((r) => r.success).length,
      details: results,
    })
  } catch (error: any) {
    console.error("Generate Error:", error)
    return NextResponse.json(
      { error: "Erro ao gerar espelhos.", detail: error.message },
      { status: 500 }
    )
  }
}
