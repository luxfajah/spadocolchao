"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getReceivables(filters: any = {}) {
  const { status, customerId, startDate, endDate, query } = filters

  const where: any = {}

  if (status && status !== "ALL") {
    where.status = status
  }

  if (customerId) {
    where.customerId = customerId
  }

  if (startDate || endDate) {
    where.dueDate = {}
    if (startDate) where.dueDate.gte = new Date(startDate)
    if (endDate) where.dueDate.lte = new Date(endDate)
  }

  if (query) {
    where.OR = [
      { description: { contains: query } },
      { customer: { fullName: { contains: query } } },
      { sale: { number: { contains: query } } }
    ]
  }

  return await prisma.accountReceivable.findMany({
    where,
    include: {
      customer: { select: { fullName: true } },
      sale: { select: { number: true } },
      financialCategory: { select: { name: true } }
    },
    orderBy: { dueDate: "asc" }
  })
}

export async function receiveTitle(data: {
  titleId: string,
  amount: number,
  accountId: string,
  receivedDate: Date,
  categoryId?: string,
  notes?: string
}) {
  const { titleId, amount, accountId, receivedDate, categoryId, notes } = data

  const title = await prisma.accountReceivable.findUnique({
    where: { id: titleId }
  })

  if (!title) throw new Error("Título não encontrado")

  const newPaidAmount = title.paidAmount + amount
  const newStatus = newPaidAmount >= title.amount ? "RECEIVED" : "PARTIALLY_RECEIVED"

  return await prisma.$transaction(async (tx) => {
    // 1. Atualizar Título
    const updatedTitle = await tx.accountReceivable.update({
      where: { id: titleId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        receivedDate: receivedDate,
        financialAccountId: accountId,
        financialCategoryId: categoryId || title.financialCategoryId
      }
    })

    // 2. Criar Transação Financeira
    const transaction = await tx.financialTransaction.create({
      data: {
        type: "ENTRY",
        amount: amount,
        transactionDate: receivedDate,
        description: `Recebimento: ${title.description}`,
        status: "CONFIRMED",
        financialAccountId: accountId,
        financialCategoryId: categoryId || title.financialCategoryId
      }
    })

    // 3. Alocação de Pagamento
    await tx.paymentAllocation.create({
      data: {
        transactionId: transaction.id,
        accountReceivableId: titleId,
        amountAllocated: amount
      }
    })

    // 4. Atualizar Saldo da Conta
    await tx.financialAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: { increment: amount }
      }
    })

    return updatedTitle
  }).then((res) => {
    revalidatePath("/financeiro/dashboard")
    revalidatePath("/financeiro/contas-a-receber")
    return res
  })
}

export async function getAccountReceivableFormData() {
  const [customers, costCenters, categories, accounts, paymentMethods] = await Promise.all([
    prisma.customer.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" }
    }),
    prisma.costCenter.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" }
    }),
    prisma.financialCategory.findMany({
      where: { isActive: true, type: "ENTRY" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" }
    }),
    prisma.financialAccount.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ])

  return { customers, costCenters, categories, accounts, paymentMethods }
}

export async function saveReceivable(data: any) {
  const { id, ...rest } = data
  
  const payload = {
    ...rest,
    amount: parseFloat(rest.amount),
    dueDate: new Date(rest.dueDate),
    issueDate: rest.issueDate ? new Date(rest.issueDate) : new Date(),
    status: rest.status || "PENDING",
  }

  if (id) {
    const updated = await prisma.accountReceivable.update({
      where: { id },
      data: payload
    })
    revalidatePath("/financeiro/contas-a-receber")
    return updated
  }

  const created = await prisma.accountReceivable.create({
    data: payload
  })
  revalidatePath("/financeiro/contas-a-receber")
  return created
}

export async function deleteReceivable(id: string) {
  await prisma.accountReceivable.delete({
    where: { id }
  })
  revalidatePath("/financeiro/contas-a-receber")
}
