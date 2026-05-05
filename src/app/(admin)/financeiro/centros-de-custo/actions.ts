"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import {
  ensureMirroredCategoriesForCostCenters,
  syncMissingPayrollExpenseAllocations,
} from "@/lib/finance/unified-cost-classification"

function buildMirroredCategoryCode(costCenterCode: string) {
  return `CC_${costCenterCode.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`
}

function resolveCostCenterPeriod(period?: string) {
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    return period
  }

  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function getPeriodBounds(period: string) {
  const [year, month] = period.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  return { start, end }
}

function buildCostCenterCode(name: string) {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalizedName
    ? normalizedName.slice(0, 12)
    : `CC_${randomBytes(3).toString("hex").toUpperCase()}`
}

function normalizeSelectedCategoryIds(value: unknown) {
  if (!value) return []
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(item => String(item)).filter(Boolean)))
  }

  return []
}

export async function getCostCenterCategoryOptions() {
  await ensureMirroredCategoriesForCostCenters()

  return prisma.financialCategory.findMany({
    where: {
      type: { in: ["EXIT", "BOTH"] },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      isActive: true,
    },
  })
}

export async function getCostCenters(period?: string) {
  await ensureMirroredCategoriesForCostCenters()
  await syncMissingPayrollExpenseAllocations()

  const selectedPeriod = resolveCostCenterPeriod(period)
  const { start, end } = getPeriodBounds(selectedPeriod)

  const centers = await prisma.costCenter.findMany({
    orderBy: { name: "asc" },
    include: {
      financialCategories: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          isActive: true,
        },
      },
    },
  })

  const mirroredCostCenterMap = new Map(
    centers.map(center => [buildMirroredCategoryCode(center.code), center])
  )

  const payables = await prisma.accountPayable.findMany({
    where: {
      issueDate: { gte: start, lt: end },
      status: { not: "CANCELLED" },
    },
    orderBy: { issueDate: "desc" },
    select: {
      id: true,
      description: true,
      amount: true,
      paidAmount: true,
      status: true,
      issueDate: true,
      dueDate: true,
      paymentDate: true,
      costCenterId: true,
      financialCategoryId: true,
      costCenter: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
        },
      },
      financialCategory: {
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
          type: true,
        },
      },
    },
  })

  const normalizedPayables = payables.map(payable => {
    const resolvedCenter =
      payable.costCenter ||
      (payable.financialCategory?.code
        ? mirroredCostCenterMap.get(payable.financialCategory.code) || null
        : null)

    return {
      id: payable.id,
      description: payable.description,
      amount: payable.amount || 0,
      paidAmount: payable.paidAmount || 0,
      pendingAmount: Math.max((payable.amount || 0) - (payable.paidAmount || 0), 0),
      status: payable.status,
      issueDate: payable.issueDate,
      dueDate: payable.dueDate,
      paymentDate: payable.paymentDate,
      costCenterId: resolvedCenter?.id || null,
      costCenterCode: resolvedCenter?.code || null,
      costCenterName: resolvedCenter?.name || null,
      financialCategoryId: payable.financialCategory?.id || null,
      financialCategoryCode: payable.financialCategory?.code || null,
      financialCategoryName: payable.financialCategory?.name || null,
      financialCategoryType: payable.financialCategory?.type || null,
      financialCategoryIsMirrored:
        Boolean(payable.financialCategory?.code) &&
        String(payable.financialCategory?.code).startsWith("CC_"),
    }
  })

  const mappedCenters = centers.map(center => {
    const relatedPayables = normalizedPayables.filter(
      payable => payable.costCenterId === center.id
    )

    const currentMonthAmount = relatedPayables.reduce(
      (total, payable) => total + payable.amount,
      0
    )
    const currentMonthPaid = relatedPayables.reduce(
      (total, payable) => total + payable.paidAmount,
      0
    )
    const currentMonthPending = relatedPayables.reduce(
      (total, payable) => total + payable.pendingAmount,
      0
    )

    return {
      ...center,
      currentMonthAmount,
      currentMonthPaid,
      currentMonthPending,
      payableCount: relatedPayables.length,
      selectedPeriod,
    }
  })

  return {
    centers: mappedCenters,
    payables: normalizedPayables,
    selectedPeriod,
  }
}

export async function saveCostCenter(data: any) {
  const { id, currentMonthAmount, currentMonthPaid, categoryIds, ...saveData } = data
  const name = String(saveData.name || "").trim()
  const code = String(saveData.code || "").trim().toUpperCase() || buildCostCenterCode(name)
  const description = String(saveData.description || "").trim() || null
  const isActive = saveData.isActive !== undefined ? Boolean(saveData.isActive) : true
  const selectedCategoryIds = normalizeSelectedCategoryIds(categoryIds)

  if (!name) {
    throw new Error("Informe o nome do centro de custo.")
  }

  const allowedCategories = await prisma.financialCategory.findMany({
    where: {
      id: { in: selectedCategoryIds },
      type: { in: ["EXIT", "BOTH"] },
    },
    select: { id: true },
  })

  if (allowedCategories.length !== selectedCategoryIds.length) {
    throw new Error("Selecione apenas categorias de gasto validas para este centro de custo.")
  }

  const savedCostCenter = id
    ? await prisma.costCenter.update({
        where: { id },
        data: {
          code,
          name,
          description,
          isActive,
        },
        select: { id: true, code: true, name: true, isActive: true },
      })
    : await prisma.costCenter.create({
        data: {
          code,
          name,
          description,
          isActive,
        },
        select: { id: true, code: true, name: true, isActive: true },
      })

  await ensureMirroredCategoriesForCostCenters()

  const mirroredCategoryCode = buildMirroredCategoryCode(savedCostCenter.code)
  const mirroredCategory = await prisma.financialCategory.findFirst({
    where: { code: mirroredCategoryCode },
    select: { id: true },
  })

  const finalCategoryIds = Array.from(
    new Set([
      ...selectedCategoryIds,
      ...(mirroredCategory?.id ? [mirroredCategory.id] : []),
    ])
  )

  await prisma.costCenter.update({
    where: { id: savedCostCenter.id },
    data: {
      financialCategories: {
        set: finalCategoryIds.map(categoryId => ({ id: categoryId })),
      },
    },
  })

  revalidatePath("/financeiro/centros-de-custo")
  revalidatePath("/financeiro/categorias-financeiras")
}

export async function toggleCostCenterStatus(id: string, currentStatus: boolean) {
  await prisma.costCenter.update({
    where: { id },
    data: { isActive: !currentStatus },
  })
  await ensureMirroredCategoriesForCostCenters()
  revalidatePath("/financeiro/centros-de-custo")
  revalidatePath("/financeiro/categorias-financeiras")
}
