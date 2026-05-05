"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function parseFormDataToData(formData: FormData) {
  const parseFloatSafe = (val: FormDataEntryValue | null) => val ? parseFloat(val as string) : null
  const parseIntSafe = (val: FormDataEntryValue | null) => val ? parseInt(val as string, 10) : null
  const parseBool = (val: FormDataEntryValue | null) => val === "true"
  const parseStringSafe = (val: FormDataEntryValue | null) => val && typeof val === "string" && val.trim() !== "" ? val : null

  return {
    code: parseStringSafe(formData.get("code")), // Evita conflito de constraint @unique para strings vazias
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    description: parseStringSafe(formData.get("description")),
    imageUrl: parseStringSafe(formData.get("imageUrl")),
    unit: parseStringSafe(formData.get("unit")),
    defaultPrice: parseFloatSafe(formData.get("defaultPrice")),
    defaultCost: parseFloatSafe(formData.get("defaultCost")),
    productionTimeMinutes: parseIntSafe(formData.get("productionTimeMinutes")),
    isActive: parseBool(formData.get("isActive")),
    
    // Identificação
    operationalCategory: parseStringSafe(formData.get("operationalCategory")),
    internalNotes: parseStringSafe(formData.get("internalNotes")),

    // Comercial
    minimumPrice: parseFloatSafe(formData.get("minimumPrice")),
    allowPriceChangeInPDV: parseBool(formData.get("allowPriceChangeInPDV")),
    requirePriceChangeJustification: parseBool(formData.get("requirePriceChangeJustification")),
    defaultCommission: parseFloatSafe(formData.get("defaultCommission")),
    averageLeadTime: parseIntSafe(formData.get("averageLeadTime")),
    highlightInPDV: parseBool(formData.get("highlightInPDV")),
    
    // Operacional
    operationalConfig: parseStringSafe(formData.get("operationalConfig")),
    
    // Ficha
    useTechnicalSheet: parseBool(formData.get("useTechnicalSheet")),
    consumesStock: parseBool(formData.get("consumesStock")),
    generatesProductionOrder: parseBool(formData.get("generatesProductionOrder")),
    estimatedLaborCost: parseFloatSafe(formData.get("estimatedLaborCost")),
    wastePercentage: parseFloatSafe(formData.get("wastePercentage")) || 0,
    
    // Estoque
    managesStock: parseBool(formData.get("managesStock")),
    minimumStock: parseFloatSafe(formData.get("minimumStock")) || 0,
    currentStock: parseFloatSafe(formData.get("currentStock")) || 0,
    lastCost: parseFloatSafe(formData.get("lastCost")),
    stockLocation: parseStringSafe(formData.get("stockLocation")),
    purchaseLeadTime: parseIntSafe(formData.get("purchaseLeadTime")),
    
    // Fiscal
    ncm: parseStringSafe(formData.get("ncm")),
    cest: parseStringSafe(formData.get("cest")),
    cfop: parseStringSafe(formData.get("cfop")),
    taxOrigin: parseStringSafe(formData.get("taxOrigin")),
    taxNotes: parseStringSafe(formData.get("taxNotes")),
  }
}

export async function createProdutoServico(formData: FormData) {
  try {
    const data = parseFormDataToData(formData)
    const record = await prisma.productService.create({ data })
    revalidatePath("/estoque-produtos/produtos-servicos")
    return { success: true, id: record.id }
  } catch (error: any) {
    console.error("ERRO AO CRIAR PRODUTO:", error.message || error)
    return { success: false, error: error.message || "Erro desconhecido ao criar produto." }
  }
}

export async function updateProdutoServico(id: string, formData: FormData) {
  try {
    const data = parseFormDataToData(formData)
    await prisma.productService.update({
      where: { id },
      data 
    })
    revalidatePath("/estoque-produtos/produtos-servicos")
    return { success: true }
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR PRODUTO:", error.message || error)
    return { success: false, error: error.message || "Erro desconhecido ao atualizar produto." }
  }
}

export async function toggleProdutoServicoStatus(id: string, currentStatus: boolean) {
  await prisma.productService.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/estoque-produtos/produtos-servicos")
}

export async function duplicateProduct(id: string) {
  const original = await prisma.productService.findUnique({
    where: { id }
  })
  if (!original) throw new Error("Product not found")

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, code: _code, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = original

  await prisma.productService.create({
    data: {
      ...data,
      name: `${data.name} (Cópia)`,
      code: `${original.code || ""}-C${Math.floor(Math.random() * 1000)}`,
      isActive: false
    }
  })
  revalidatePath("/estoque-produtos/produtos-servicos")
  return { success: true }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.productService.delete({
      where: { id }
    })
    revalidatePath("/estoque-produtos/produtos-servicos")
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function massActionProducts(action: string, ids: string[]) {
  if (!ids || ids.length === 0) return

  switch (action) {
    case "activate":
      await prisma.productService.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true }
      })
      break
    case "inactivate":
      await prisma.productService.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false }
      })
      break
    case "highlight":
      await prisma.productService.updateMany({
        where: { id: { in: ids } },
        data: { highlightInPDV: true }
      })
      break
    case "removeHighlight":
      await prisma.productService.updateMany({
        where: { id: { in: ids } },
        data: { highlightInPDV: false }
      })
      break
  }
  
  revalidatePath("/estoque-produtos/produtos-servicos")
}
