"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createCategoriaInsumo(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  
  await prisma.supplyCategory.create({
    data: { name, description }
  })
  
  revalidatePath("/estoque-produtos/central-de-insumos")
  redirect("/estoque-produtos/central-de-insumos?tab=categorias")
}

export async function updateCategoriaInsumo(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  
  await prisma.supplyCategory.update({
    where: { id },
    data: { name, description }
  })
  
  revalidatePath("/estoque-produtos/central-de-insumos")
  redirect("/estoque-produtos/central-de-insumos?tab=categorias")
}

export async function toggleCategoriaInsumoStatus(id: string, currentStatus: boolean) {
  await prisma.supplyCategory.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/estoque-produtos/central-de-insumos")
}
