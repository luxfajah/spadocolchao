import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { syncMissingJobTitleCostCenters } from "@/lib/finance/unified-cost-classification"

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await syncMissingJobTitleCostCenters()

    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id: params.id },
      include: {
        workSchedule: {
          select: {
            id: true,
            name: true,
            weeklyHours: true,
          },
        },
        costCenter: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    })

    if (!jobTitle) {
      return NextResponse.json({ error: "Cargo não encontrado." }, { status: 404 })
    }

    return NextResponse.json(jobTitle)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const {
      name,
      department,
      description,
      shiftName,
      defaultSalary,
      workScheduleId,
      costCenterId,
      isPdvSellerRole,
      isActive,
      cbo,
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome do cargo obrigatório." }, { status: 400 })
    }

    if (!costCenterId) {
      return NextResponse.json(
        { error: "Selecione o centro de custo padrão deste cargo." },
        { status: 400 }
      )
    }

    if (workScheduleId) {
      const workSchedule = await prisma.workSchedule.findUnique({
        where: { id: workScheduleId },
        select: { id: true, isActive: true },
      })

      if (!workSchedule?.isActive) {
        return NextResponse.json({ error: "Selecione uma escala válida." }, { status: 400 })
      }
    }

    const costCenter = await prisma.costCenter.findUnique({
      where: { id: costCenterId },
      select: { id: true, isActive: true },
    })

    if (!costCenter?.isActive) {
      return NextResponse.json(
        { error: "Selecione um centro de custo válido para o cargo." },
        { status: 400 }
      )
    }

    const jobTitle = await prisma.jobTitle.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        department: department?.trim() || null,
        description: description?.trim() || null,
        shiftName: shiftName?.trim() || null,
        costCenterId,
        defaultSalary:
          defaultSalary !== undefined && defaultSalary !== null && String(defaultSalary).trim() !== ""
            ? Number(defaultSalary)
            : null,
        workScheduleId: workScheduleId || null,
        isPdvSellerRole: Boolean(isPdvSellerRole),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        cbo: cbo?.trim() || null,
      },
      include: {
        workSchedule: {
          select: {
            id: true,
            name: true,
            weeklyHours: true,
          },
        },
        costCenter: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    })

    return NextResponse.json(jobTitle)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Já existe um cargo com este nome." }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
