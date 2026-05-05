"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function upsertLeadSource(data: any) {
  try {
    const { id, ...rest } = data
    
    if (id) {
      await prisma.leadSource.update({
        where: { id },
        data: rest
      })
    } else {
      await prisma.leadSource.create({
        data: rest
      })
    }
    
    revalidatePath("/vendas-clientes/origens-de-venda")
    return { success: true }
  } catch (error: any) {
    console.error("Error upserting lead source:", error)
    return { success: false, error: error.message }
  }
}

export async function toggleLeadSourceStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.leadSource.update({
      where: { id },
      data: { isActive: !currentStatus }
    })
    
    revalidatePath("/vendas-clientes/origens-de-venda")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteLeadSource(id: string) {
  try {
    // Check if there are related sales
    const count = await prisma.sale.count({ where: { leadSourceId: id } })
    if (count > 0) {
      // Option to force delete or just deactivate, since user said 's' (yes)
      // I'll allow deletion but mention it can be risky
      // Wait, 's' for 'sim' to 'Should we allow deleting... or only allow deactivating?' 
      // User said 's' to 'Should we allow deleting'.
    }
    
    await prisma.leadSource.delete({
      where: { id }
    })
    
    revalidatePath("/vendas-clientes/origens-de-venda")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Alteração para evitar erro de "Cannot redefine property: $$id" no build do Next.js
// e garantir suporte a FormData vindo de ações de formulário vinculadas (.bind)
export async function createOrigem(data: any) {
  return upsertLeadSource(data)
}

export async function updateOrigem(id: string, data: any) {
  // Se 'data' for FormData (vindo de um formulário via action), processamos os campos
  if (data instanceof FormData) {
    const obj: any = { id }
    data.forEach((value, key) => {
      if (['isActive', 'commissionEligible', 'hasCommissionOverride', 'requiresDetail', 'isDefaultPdv'].includes(key)) {
        obj[key] = value === 'on' || value === 'true'
      } else if (['priority', 'estimatedCost'].includes(key)) {
        obj[key] = Number(value)
      } else {
        obj[key] = value
      }
    })
    return upsertLeadSource(obj)
  }

  // Caso contrário, assume-se que é um objeto plano
  return upsertLeadSource({ ...data, id })
}
