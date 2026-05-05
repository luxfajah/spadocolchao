"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getAccounts() {
  return await prisma.financialAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  })
}

export async function saveAccount(data: any) {
  const { id, ...saveData } = data

  let account;
  if (id) {
    account = await prisma.financialAccount.update({
      where: { id },
      data: {
        ...saveData,
        initialBalance: parseFloat(saveData.initialBalance)
      }
    })
  } else {
    account = await prisma.financialAccount.create({
      data: {
        ...saveData,
        initialBalance: parseFloat(saveData.initialBalance),
        currentBalance: parseFloat(saveData.initialBalance),
        status: "ACTIVE"
      }
    })
  }

  revalidatePath("/financeiro/contas-bancarias")
  revalidatePath("/financeiro/dashboard")
  return account
}

export async function toggleAccountStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
  
  await prisma.financialAccount.update({
    where: { id },
    data: { status: newStatus }
  })
  
  revalidatePath("/financeiro/contas-bancarias")
  revalidatePath("/financeiro/dashboard")
}
