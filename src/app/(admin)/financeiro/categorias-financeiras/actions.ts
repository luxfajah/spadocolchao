"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import { ensureMirroredCategoriesForCostCenters } from "@/lib/finance/unified-cost-classification"

function buildCategoryCode(name: string) {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  return normalizedName ? `CAT_${normalizedName.slice(0, 18)}` : `CAT_${randomBytes(3).toString("hex").toUpperCase()}`
}

export async function getCategories() {
  await ensureMirroredCategoriesForCostCenters()

  return await prisma.financialCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { accountsPayable: true, accountsReceivable: true, transactions: true, costCenters: true }
      }
    }
  })
}

export async function saveCategory(data: any) {
  const { id, ...saveData } = data
  const payload = {
    ...saveData,
    code: saveData.code || buildCategoryCode(saveData.name || ""),
    type: saveData.type || "EXIT",
    description: saveData.description || null,
    isActive: saveData.isActive !== undefined ? Boolean(saveData.isActive) : true,
  }

  if (id) {
    await prisma.financialCategory.update({
      where: { id },
      data: payload
    })
  } else {
    await prisma.financialCategory.create({
      data: payload
    })
  }

  revalidatePath("/financeiro/categorias-financeiras")
  revalidatePath("/financeiro/centros-de-custo")
}

export async function toggleCategoryStatus(id: string, currentStatus: boolean) {
  await prisma.financialCategory.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/financeiro/categorias-financeiras")
  revalidatePath("/financeiro/centros-de-custo")
}
