import { NextRequest, NextResponse } from "next/server"
import { parsePunchTxt, analyzePunches } from "@/lib/attendance/parser"
import { prisma } from "@/lib/prisma"
import { isAttendanceAdmin } from "@/lib/attendance/auth"

export async function POST(req: NextRequest) {
  try {
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const raw = parsePunchTxt(buffer)
    
    if (raw.length === 0) {
      return NextResponse.json(
        { error: "Nenhum registro encontrado no arquivo.", detail: `Arquivo processado resultou em 0 linhas lidas. Tamanho original: ${buffer.length} bytes.` },
        { status: 400 }
      )
    }

    const analysis = analyzePunches(raw)

    // Cruzar com o módulo de RH por pointMachineId OU serialId
    const pointIds = analysis.employees.map((e) => e.pointMachineId)
    const numericPointIds = pointIds.filter(id => !isNaN(Number(id))).map(id => parseInt(id))

    const rhEmployees = await (prisma as any).employee.findMany({
      where: { 
        OR: [
          { pointMachineId: { in: pointIds } },
          { serialId: { in: numericPointIds } }
        ]
      },
      select: { id: true, fullName: true, socialName: true, pointMachineId: true, serialId: true },
    })

    const empMap = new Map()
    rhEmployees.forEach((e: any) => {
      if (e.pointMachineId) empMap.set(e.pointMachineId, e)
      if (e.serialId) empMap.set(e.serialId.toString(), e)
    })

    const response = {
      startDate: analysis.startDate,
      endDate: analysis.endDate,
      employees: analysis.employees.map((e) => ({
        ...e,
        rhEmployee: empMap.get(e.pointMachineId) || null,
      })),
      totalRecords: raw.length,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("Parse Error:", error)
    return NextResponse.json(
      { error: "Erro ao analisar arquivo.", detail: error.message },
      { status: 500 }
    )
  }
}
