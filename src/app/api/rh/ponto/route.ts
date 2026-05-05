import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, period, records } = body

    if (!records || records.length === 0) {
      return NextResponse.json({ error: "Nenhum registro encontrado." }, { status: 400 })
    }

    // Buscar todos os funcionários para tentar cruzar PIS
    const employees = await (prisma as any).employee.findMany({
      select: { id: true, fullName: true, cpf: true, pis: true },
      where: { status: "ACTIVE" }
    })

    // Criar o lote de importação
    const batch = await (prisma as any).punchImportBatch.create({
      data: {
        fileName,
        period,
        totalRecords: records.length,
        notes: `Importação automática via sistema. ${records.length} batidas processadas.`
      }
    })

    // Criar os registros cruzando com funcionários pelo PIS
    const punchRecords = records.map((r: any) => {
      const emp = employees.find((e: any) => e.pis && e.pis.replace(/\D/g, '') === r.pis?.replace(/\D/g, ''))
      return {
        batchId: batch.id,
        employeeId: emp?.id || null,
        pis: r.pis || null,
        employeeName: r.employeeName || emp?.fullName || null,
        punchDate: new Date(r.punchDate),
        punchType: r.punchType || "UNKNOWN",
        source: r.source || "AFD",
      }
    })

    await (prisma as any).punchRecord.createMany({ data: punchRecords })

    return NextResponse.json({
      batchId: batch.id,
      totalImported: punchRecords.length,
      matched: punchRecords.filter((r: any) => r.employeeId).length,
      unmatched: punchRecords.filter((r: any) => !r.employeeId).length,
    }, { status: 201 })

  } catch (error: any) {
    console.error("Erro ao importar ponto:", error)
    return NextResponse.json({ error: "Erro interno ao importar arquivo.", detail: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const batches = await (prisma as any).punchImportBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { records: true } } }
    })
    return NextResponse.json(batches)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
