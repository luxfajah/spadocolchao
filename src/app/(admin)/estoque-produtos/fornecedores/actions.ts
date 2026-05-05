"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createSupplier(formData: FormData) {
  const legalName = formData.get("legalName") as string
  if (!legalName) throw new Error("A razão social é obrigatória")

  const data = {
    personType: formData.get("personType") as string || "JURIDICA",
    document: formData.get("document") as string || null,
    legalName,
    tradeName: formData.get("tradeName") as string || null,
    stateRegistration: formData.get("stateRegistration") as string || null,
    email: formData.get("email") as string || null,
    phone: formData.get("phone") as string || null,
    whatsapp: formData.get("whatsapp") as string || null,
    contactPerson: formData.get("contactPerson") as string || null,
    zipCode: formData.get("zipCode") as string || null,
    street: formData.get("street") as string || null,
    number: formData.get("number") as string || null,
    complement: formData.get("complement") as string || null,
    neighborhood: formData.get("neighborhood") as string || null,
    city: formData.get("city") as string || null,
    state: formData.get("state") as string || null,
    notes: formData.get("notes") as string || null,
  }

  await prisma.supplier.create({ data })

  revalidatePath("/estoque-produtos/suprimentos")
  redirect("/estoque-produtos/suprimentos?tab=fornecedores")
}

export async function updateSupplier(id: string, formData: FormData) {
  const legalName = formData.get("legalName") as string
  if (!legalName) throw new Error("A razão social é obrigatória")

  const data = {
    personType: formData.get("personType") as string || "JURIDICA",
    document: formData.get("document") as string || null,
    legalName,
    tradeName: formData.get("tradeName") as string || null,
    stateRegistration: formData.get("stateRegistration") as string || null,
    email: formData.get("email") as string || null,
    phone: formData.get("phone") as string || null,
    whatsapp: formData.get("whatsapp") as string || null,
    contactPerson: formData.get("contactPerson") as string || null,
    zipCode: formData.get("zipCode") as string || null,
    street: formData.get("street") as string || null,
    number: formData.get("number") as string || null,
    complement: formData.get("complement") as string || null,
    neighborhood: formData.get("neighborhood") as string || null,
    city: formData.get("city") as string || null,
    state: formData.get("state") as string || null,
    notes: formData.get("notes") as string || null,
  }

  await prisma.supplier.update({ where: { id }, data })

  revalidatePath("/estoque-produtos/suprimentos")
  // Não redireciona, apenas revalida para ficar na página de edição (melhor UX na edição)
  revalidatePath(`/estoque-produtos/fornecedores/${id}`)
}

export async function toggleSupplierStatus(id: string, currentStatus: boolean) {
  await prisma.supplier.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/estoque-produtos/suprimentos")
  revalidatePath(`/estoque-produtos/fornecedores/${id}`)
}
