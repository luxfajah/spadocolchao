import { prisma } from "@/lib/prisma"

type PayrollEmployeeAllocationSource = {
  id?: string
  name?: string | null
  costCenterId?: string | null
  costCenter?: {
    id?: string
    code?: string | null
    name?: string | null
    isActive?: boolean | null
  } | null
  department?: string | null
  jobTitle?: {
    name?: string | null
    department?: string | null
    costCenterId?: string | null
    costCenter?: {
      id?: string
      code?: string | null
      name?: string | null
      isActive?: boolean | null
    } | null
  } | null
}

type CostCenterRecord = {
  id: string
  code: string
  name: string
  isActive: boolean
}

type UnifiedCostClassification = {
  costCenterId: string | null
  costCenterName: string | null
  financialCategoryId: string | null
  financialCategoryName: string | null
  sectorName: string | null
}

function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizeValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildMirroredCategoryCode(costCenterCode: string) {
  return `CC_${costCenterCode.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`
}

function scoreCostCenterMatch(costCenter: CostCenterRecord, terms: string[]) {
  const normalizedName = normalizeText(costCenter.name)
  const normalizedCode = normalizeText(costCenter.code)

  let score = 0

  for (const term of terms) {
    if (!term) continue
    if (normalizedName === term || normalizedCode === term) {
      score += 120
      continue
    }
    if (normalizedName.includes(term) || term.includes(normalizedName)) {
      score += 80
      continue
    }

    const termWords = term.split(" ").filter(Boolean)
    const matchedWords = termWords.filter(word => normalizedName.includes(word))
    score += matchedWords.length * 15
  }

  return score
}

async function findMatchingCostCenter(
  source: PayrollEmployeeAllocationSource
): Promise<CostCenterRecord | null> {
  const directCostCenterId = source.costCenterId || source.jobTitle?.costCenterId || source.costCenter?.id

  if (directCostCenterId) {
    const directMatch = await prisma.costCenter.findUnique({
      where: { id: directCostCenterId },
      select: { id: true, code: true, name: true, isActive: true },
    })

    if (directMatch?.isActive) {
      return directMatch
    }
  }

  const terms = [
    normalizeText(source.costCenter?.name),
    normalizeText(source.jobTitle?.costCenter?.name),
    normalizeText(source.department),
    normalizeText(source.name),
    normalizeText(source.jobTitle?.name),
    normalizeText(source.jobTitle?.department),
  ].filter(Boolean)

  if (terms.length === 0) {
    return null
  }

  const costCenters = await prisma.costCenter.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, isActive: true },
  })

  const rankedCostCenters = costCenters
    .map(costCenter => ({
      costCenter,
      score: scoreCostCenterMatch(costCenter, terms),
    }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score)

  return rankedCostCenters[0]?.costCenter || null
}

async function ensureMirroredFinancialCategory(costCenter: CostCenterRecord) {
  const mirroredCode = buildMirroredCategoryCode(costCenter.code)
  const mirroredName = costCenter.name

  // Busca por qualquer categoria existente com esse código ou nome, ignorando o tipo inicialmente
  // para evitar erros de restrição única do SQLite.
  const existingCategory = await prisma.financialCategory.findFirst({
    where: {
      OR: [{ code: mirroredCode }, { name: mirroredName }],
    },
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
      isActive: true,
    },
  })

  if (existingCategory) {
    // Se a categoria existe mas está com dados desatualizados (incluindo o 'type' que deve ser 'EXIT' ou 'BOTH'), atualize.
    const needsUpdate = 
      existingCategory.isActive !== costCenter.isActive || 
      existingCategory.name !== mirroredName ||
      existingCategory.code !== mirroredCode ||
      !["EXIT", "BOTH"].includes(existingCategory.type)

    if (needsUpdate) {
      const updatedCategory = await prisma.financialCategory.update({
        where: { id: existingCategory.id },
        data: {
          code: mirroredCode,
          name: mirroredName,
          isActive: costCenter.isActive,
          // Se era ENTRY, mudamos para BOTH ou mantemos EXIT. 
          // Para simplificar, garantimos que seja pelo menos EXIT.
          type: existingCategory.type === "ENTRY" ? "BOTH" : "EXIT",
          description: `Categoria espelhada do centro de custo ${costCenter.name}.`,
        },
        select: {
          id: true,
          name: true,
        },
      })

      return updatedCategory
    }

    return existingCategory
  }

  return prisma.financialCategory.create({
    data: {
      code: mirroredCode,
      name: mirroredName,
      type: "EXIT",
      description: `Categoria espelhada do centro de custo ${costCenter.name}.`,
      isActive: costCenter.isActive,
    },
    select: {
      id: true,
      name: true,
    },
  })
}

async function ensureMirroredCategoryLinkedToCostCenter(
  costCenterId: string,
  financialCategoryId: string
) {
  const existingRelation = await prisma.costCenter.findFirst({
    where: {
      id: costCenterId,
      financialCategories: {
        some: {
          id: financialCategoryId,
        },
      },
    },
    select: { id: true },
  })

  if (existingRelation) {
    return
  }

  await prisma.costCenter.update({
    where: { id: costCenterId },
    data: {
      financialCategories: {
        connect: [{ id: financialCategoryId }],
      },
    },
  })
}

export async function resolveUnifiedCostClassification(
  source: PayrollEmployeeAllocationSource
): Promise<UnifiedCostClassification> {
  const sectorName =
    normalizeValue(source.department) || normalizeValue(source.jobTitle?.department) || null

  const matchedCostCenter = await findMatchingCostCenter(source)

  if (!matchedCostCenter) {
    return {
      costCenterId: null,
      costCenterName: null,
      financialCategoryId: null,
      financialCategoryName: null,
      sectorName,
    }
  }

  const mirroredCategory = await ensureMirroredFinancialCategory(matchedCostCenter)
  
  // Prioritize "Salários e Encargos" (DESP_SAL) for payroll allocations
  const salaryCategory = await prisma.financialCategory.findFirst({
    where: { 
      code: "DESP_SAL",
      isActive: true,
      type: { in: ["EXIT", "BOTH"] }
    },
    select: { id: true, name: true }
  })
  
  const finalCategory = salaryCategory || mirroredCategory

  return {
    costCenterId: matchedCostCenter.id,
    costCenterName: matchedCostCenter.name,
    financialCategoryId: finalCategory.id,
    financialCategoryName: finalCategory.name,
    sectorName,
  }
}

export async function syncMissingPayrollExpenseAllocations() {
  const payables = await prisma.accountPayable.findMany({
    where: {
      payrollId: { not: null },
      OR: [{ costCenterId: null }, { financialCategoryId: null }],
    },
    include: {
      payroll: {
        include: {
          employee: {
            select: {
              id: true,
              department: true,
              costCenterId: true,
              costCenter: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  isActive: true,
                },
              },
              jobTitle: {
                select: {
                  name: true,
                  department: true,
                  costCenterId: true,
                  costCenter: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      isActive: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  for (const payable of payables) {
    if (!payable.payroll?.employee) {
      continue
    }

    const classification = await resolveUnifiedCostClassification(payable.payroll.employee)

    if (!classification.costCenterId && !classification.financialCategoryId) {
      continue
    }

    await prisma.accountPayable.update({
      where: { id: payable.id },
      data: {
        costCenterId: payable.costCenterId || classification.costCenterId || null,
        financialCategoryId:
          payable.financialCategoryId || classification.financialCategoryId || null,
      },
    })
  }
}

export async function ensureMirroredCategoriesForCostCenters() {
  const costCenters = await prisma.costCenter.findMany({
    select: { id: true, code: true, name: true, isActive: true },
  })

  for (const costCenter of costCenters) {
    const mirroredCategory = await ensureMirroredFinancialCategory(costCenter)
    await ensureMirroredCategoryLinkedToCostCenter(costCenter.id, mirroredCategory.id)
  }
}

export async function syncMissingJobTitleCostCenters() {
  const jobTitles = await prisma.jobTitle.findMany({
    where: {
      costCenterId: null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      department: true,
    },
  })

  for (const jobTitle of jobTitles) {
    const classification = await resolveUnifiedCostClassification({
      name: jobTitle.name,
      department: jobTitle.department,
    })

    if (!classification.costCenterId) {
      continue
    }

    await prisma.jobTitle.update({
      where: { id: jobTitle.id },
      data: {
        costCenterId: classification.costCenterId,
      },
    })
  }
}
