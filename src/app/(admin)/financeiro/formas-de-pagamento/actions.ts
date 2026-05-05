"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"

export async function getPaymentMethods() {
  return await prisma.paymentMethod.findMany({
    orderBy: { name: "asc" },
    include: { installmentFees: { orderBy: { installments: "asc" } } }
  })
}

export async function savePaymentMethod(data: any) {
  const { id, installmentFees, ...saveData } = data

  if (id) {
    await prisma.$transaction(async (tx) => {
      await tx.paymentMethod.update({
        where: { id },
        data: saveData
      })

      if (installmentFees) {
        await tx.paymentMethodInstallmentFee.deleteMany({ where: { paymentMethodId: id } })
        if (installmentFees.length > 0) {
          await tx.paymentMethodInstallmentFee.createMany({
            data: installmentFees.map((f: any) => ({
              installments: f.installments,
              feePercentage: f.feePercentage,
              paymentMethodId: id
            }))
          })
        }
      }
    })
  } else {
    // Inject code if missing
    saveData.code = saveData.code || `PM-${randomBytes(3).toString('hex').toUpperCase()}`
    
    await prisma.$transaction(async (tx) => {
      const method = await tx.paymentMethod.create({
        data: saveData
      })

      if (installmentFees && installmentFees.length > 0) {
        await tx.paymentMethodInstallmentFee.createMany({
          data: installmentFees.map((f: any) => ({
            installments: f.installments,
            feePercentage: f.feePercentage,
            paymentMethodId: method.id
          }))
        })
      }
    })
  }

  revalidatePath("/financeiro/formas-de-pagamento")
}

export async function togglePaymentMethodStatus(id: string, currentStatus: boolean) {
  await prisma.paymentMethod.update({
    where: { id },
    data: { isActive: !currentStatus }
  })
  revalidatePath("/financeiro/formas-de-pagamento")
}
