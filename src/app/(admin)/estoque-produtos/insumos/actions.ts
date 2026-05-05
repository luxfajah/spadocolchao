"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function createInsumo(formData: FormData) {
  const code = formData.get("code") as string
  const name = formData.get("name") as string
  const unit = formData.get("unit") as string
  const categoryId = formData.get("categoryId") as string || null

  const supplierId = formData.get("supplierId") as string
  const purchaseUnit = formData.get("purchaseUnit") as string
  const defaultUnitCost = parseFloat(formData.get("defaultUnitCost") as string)
  const leadTimeDays = parseInt(formData.get("leadTimeDays") as string) || 0
  
  if (!supplierId || !purchaseUnit || isNaN(defaultUnitCost)) {
    throw new Error("Fornecedor principal e dados de compra são obrigatórios")
  }

  const imageFile = formData.get("image") as File | null
  let imageUrl = undefined

  if (imageFile && imageFile.size > 0 && imageFile.name) {
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'insumos')
    
    await mkdir(uploadDir, { recursive: true }).catch(console.error)
    await writeFile(join(uploadDir, fileName), buffer)
    
    imageUrl = `/uploads/insumos/${fileName}`
  }

  await prisma.supplyItem.create({
    data: { 
      code, name, unit, categoryId, primarySupplierId: supplierId,
      imageUrl,
      supplierSupplyItems: {
        create: {
          supplierId,
          purchaseUnit,
          defaultUnitCost,
          leadTimeDays,
          isPrimary: true
        }
      }
    }
  })
  
  revalidatePath("/estoque-produtos/suprimentos")
  redirect("/estoque-produtos/suprimentos?tab=insumos")
}

export async function updateInsumo(id: string, formData: FormData) {
  const code = formData.get("code") as string
  const name = formData.get("name") as string
  const unit = formData.get("unit") as string
  const categoryId = formData.get("categoryId") as string || null
  
  const imageFile = formData.get("image") as File | null
  let imageUrl = undefined

  if (imageFile && imageFile.size > 0 && imageFile.name) {
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'insumos')
    
    await mkdir(uploadDir, { recursive: true }).catch(console.error)
    await writeFile(join(uploadDir, fileName), buffer)
    
    imageUrl = `/uploads/insumos/${fileName}`
  }

  await prisma.supplyItem.update({
    where: { id },
    data: { 
      code, name, unit, categoryId,
      ...(imageUrl && { imageUrl })
    }
  })
  
  revalidatePath("/estoque-produtos/suprimentos")
  redirect("/estoque-produtos/suprimentos?tab=insumos")
}

export async function toggleInsumoStatus(id: string, currentStatus: boolean) {
  await prisma.supplyItem.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/estoque-produtos/suprimentos")
}

export async function linkSupplierToInsumo(supplyItemId: string, formData: FormData) {
  const supplierId = formData.get("newSupplierId") as string
  const purchaseUnit = formData.get("newPurchaseUnit") as string
  const defaultUnitCost = parseFloat(formData.get("newDefaultUnitCost") as string)
  const leadTimeDays = parseInt(formData.get("newLeadTimeDays") as string) || 0

  if (!supplierId || !purchaseUnit || isNaN(defaultUnitCost)) return

  // Check if it already exists
  const existing = await prisma.supplierSupplyItem.findUnique({
    where: { supplierId_supplyItemId: { supplierId, supplyItemId } }
  })
  
  if (existing) return

  await prisma.supplierSupplyItem.create({
    data: {
      supplyItemId,
      supplierId,
      purchaseUnit,
      defaultUnitCost,
      leadTimeDays,
      isPrimary: false
    }
  })

  revalidatePath(`/estoque-produtos/insumos/${supplyItemId}`)
}

export async function setPrimarySupplier(supplyItemId: string, supplierSupplyItemId: string) {
  // Reset all to false
  await prisma.supplierSupplyItem.updateMany({
    where: { supplyItemId },
    data: { isPrimary: false }
  })
  // Set the chosen one to true
  const link = await prisma.supplierSupplyItem.update({
    where: { id: supplierSupplyItemId },
    data: { isPrimary: true }
  })
  
  await prisma.supplyItem.update({
    where: { id: supplyItemId },
    data: { primarySupplierId: link.supplierId }
  })
  
  revalidatePath(`/estoque-produtos/insumos/${supplyItemId}`)
}

export async function unlinkSupplier(supplyItemId: string, supplierSupplyItemId: string) {
  const link = await prisma.supplierSupplyItem.findUnique({ where: { id: supplierSupplyItemId } })
  if (!link) return
  
  if (link.isPrimary) {
    throw new Error("Não é possível remover o fornecedor principal")
  }

  await prisma.supplierSupplyItem.delete({
    where: { id: supplierSupplyItemId }
  })
  revalidatePath(`/estoque-produtos/insumos/${supplyItemId}`)
}
