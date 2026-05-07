"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cleanNumericValues } from "@/lib/utils"

export async function createCliente(formData: FormData) {
  const data = parseCustomerFormData(formData)
  
  const cliente = await prisma.customer.create({
    data: {
      ...data,
      // Se houver endereço inicial (cadastro completo), via nested create
      addresses: formData.get("street") ? {
        create: {
          type: "MAIN",
          zipCode: cleanNumericValues(formData.get("zipCode") as string),
          street: formData.get("street") as string,
          number: formData.get("number") as string,
          complement: formData.get("complement") as string,
          neighborhood: formData.get("neighborhood") as string,
          city: formData.get("city") as string,
          state: formData.get("state") as string,
          isMain: true
        }
      } : undefined
    }
  })
  
  revalidatePath("/vendas-clientes/clientes")
  redirect(`/vendas-clientes/clientes/${cliente.id}`)
}

export async function updateCliente(id: string, formData: FormData) {
  const data = parseCustomerFormData(formData)
  const hasAddress = !!formData.get("street")
  
  await prisma.customer.update({
    where: { id },
    data: {
      ...data,
      addresses: hasAddress ? {
        upsert: {
          where: { 
            // This is tricky if we don't have the address ID. 
            // Assuming there's only one MAIN address for now as per current logic.
            // We'll find the main address first or use a unique constraint if we had one.
            // For now, let's just update the first one found or create if none.
            id: (await prisma.customerAddress.findFirst({ where: { customerId: id, isMain: true } }))?.id || 'new'
          },
          update: {
            zipCode: cleanNumericValues(formData.get("zipCode") as string),
            street: formData.get("street") as string,
            number: formData.get("number") as string,
            complement: formData.get("complement") as string,
            neighborhood: formData.get("neighborhood") as string,
            city: formData.get("city") as string,
            state: formData.get("state") as string,
          },
          create: {
            type: "MAIN",
            zipCode: cleanNumericValues(formData.get("zipCode") as string),
            street: formData.get("street") as string,
            number: formData.get("number") as string,
            complement: formData.get("complement") as string,
            neighborhood: formData.get("neighborhood") as string,
            city: formData.get("city") as string,
            state: formData.get("state") as string,
            isMain: true
          }
        }
      } : undefined
    }
  })
  
  revalidatePath("/vendas-clientes/clientes")
  revalidatePath(`/vendas-clientes/clientes/${id}`)
  redirect(`/vendas-clientes/clientes/${id}`)
}

export async function toggleClienteStatus(id: string, currentStatus: boolean) {
  await prisma.customer.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/vendas-clientes/clientes")
  revalidatePath(`/vendas-clientes/clientes/${id}`)
}

export async function addCustomerNote(customerId: string, noteType: string, content: string, userId?: string) {
  await prisma.customerNote.create({
    data: {
      customerId,
      noteType,
      content,
      createdById: userId
    }
  })
  revalidatePath(`/vendas-clientes/clientes/${customerId}`)
}

export async function updateCreditLimit(customerId: string, newLimit: number, reason: string, userId?: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { creditLimit: true }
  })

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { creditLimit: newLimit }
    }),
    prisma.customerCreditHistory.create({
      data: {
        customerId,
        previousLimit: customer?.creditLimit || 0,
        newLimit: newLimit,
        reason: reason,
        changedById: userId
      }
    })
  ])
  
  revalidatePath(`/vendas-clientes/clientes/${customerId}`)
}

function parseCustomerFormData(formData: FormData) {
  const birthDateRaw = formData.get("birthDate") as string
  const incomeRaw = formData.get("income") as string
  const creditLimitRaw = formData.get("creditLimit") as string

  // Para RG, removemos apenas caracteres especiais de pontuação, mantendo letras/números (máscara flexível)
  const cleanRG = (val: string | null) => val ? val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : null

  return {
    personType: (formData.get("personType") as string) || "INDIVIDUAL",
    fullName: (formData.get("fullName") as string),
    tradeName: formData.get("tradeName") as string,
    document: cleanNumericValues(formData.get("document") as string),
    stateRegistration: formData.get("stateRegistration") as string,
    rg: cleanRG(formData.get("rg") as string),
    birthDate: birthDateRaw ? new Date(birthDateRaw) : null,
    gender: formData.get("gender") as string,
    profession: formData.get("profession") as string,
    income: incomeRaw ? parseFloat(incomeRaw) : null,
    email: formData.get("email") as string,
    phone: cleanNumericValues(formData.get("phone") as string),
    whatsapp: cleanNumericValues(formData.get("whatsapp") as string),
    instagram: formData.get("instagram") as string,
    contactPerson: formData.get("contactPerson") as string,
    notes: formData.get("notes") as string,
    sellerId: formData.get("sellerId") as string || null,
    leadSourceId: formData.get("leadSourceId") as string || null,
    creditLimit: creditLimitRaw ? parseFloat(creditLimitRaw) : 0,
    priority: (formData.get("priority") as string) || "NORMAL",
    commercialStatus: (formData.get("commercialStatus") as string) || "ACTIVE",
    invoiceEmail: formData.get("invoiceEmail") as string,
    motherName: formData.get("motherName") as string,
    fatherName: formData.get("fatherName") as string,
    companySize: formData.get("companySize") as string,
  }
}
