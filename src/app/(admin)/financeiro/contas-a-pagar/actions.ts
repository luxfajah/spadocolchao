"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { syncMissingPayrollExpenseAllocations } from "@/lib/finance/unified-cost-classification"

export async function getPayables(filters: any = {}) {
  const { status, supplierId, startDate, endDate, query } = filters
  await syncMissingPayrollExpenseAllocations()

  const where: any = {}

  if (status && status !== "ALL") {
    where.status = status
  }

  if (supplierId) {
    where.supplierId = supplierId
  }

  if (startDate || endDate) {
    where.dueDate = {}
    if (startDate) where.dueDate.gte = new Date(startDate)
    if (endDate) where.dueDate.lte = new Date(endDate)
  }

  if (query) {
    where.OR = [
      { description: { contains: query } },
      { supplier: { legalName: { contains: query } } },
      { supplier: { tradeName: { contains: query } } },
      { costCenter: { name: { contains: query } } },
      { financialCategory: { name: { contains: query } } },
      { payroll: { employee: { fullName: { contains: query } } } },
      { payroll: { employee: { socialName: { contains: query } } } },
    ]
  }

  return await prisma.accountPayable.findMany({
    where,
    include: {
      supplier: { select: { legalName: true, tradeName: true } },
      purchaseOrder: { select: { number: true } },
      financialCategory: { select: { id: true, code: true, name: true, type: true } },
      costCenter: { select: { id: true, code: true, name: true } },
      financialAccount: { select: { id: true, name: true } },
      payroll: {
        select: {
          id: true,
          referencePeriod: true,
          employee: {
            select: {
              id: true,
              fullName: true,
              socialName: true,
              department: true,
              jobTitle: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" }
  })
}

export async function payTitle(data: {
  titleId: string,
  amount: number,
  accountId: string,
  paymentDate: Date,
  categoryId?: string,
  notes?: string
}) {
  const { titleId, amount, accountId, paymentDate, categoryId, notes } = data

  const title = await prisma.accountPayable.findUnique({
    where: { id: titleId }
  })

  if (!title) throw new Error("Título não encontrado")

  const newPaidAmount = (title.paidAmount || 0) + amount
  const newStatus = newPaidAmount >= title.amount ? "PAID" : "PARTIALLY_PAID"

  return await prisma.$transaction(async (tx) => {
    // 1. Atualizar Título
    const updatedTitle = await tx.accountPayable.update({
      where: { id: titleId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentDate: paymentDate,
        financialAccountId: accountId,
        financialCategoryId: categoryId || title.financialCategoryId
      }
    })

    // 2. Criar Transação Financeira (Saída)
    const transaction = await tx.financialTransaction.create({
      data: {
        type: "EXIT",
        amount: amount,
        transactionDate: paymentDate,
        description: `Pagamento: ${title.description}`,
        status: "CONFIRMED",
        financialAccountId: accountId,
        financialCategoryId: categoryId || title.financialCategoryId
      }
    })

    // 3. Alocação de Pagamento
    await tx.paymentAllocation.create({
      data: {
        transactionId: transaction.id,
        accountPayableId: titleId,
        amountAllocated: amount
      }
    })

    // 4. Atualizar Saldo da Conta (Decremento)
    await tx.financialAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: { decrement: amount }
      }
    })

    return updatedTitle
  }).then((res) => {
    revalidatePath("/financeiro/dashboard")
    revalidatePath("/financeiro/contas-a-pagar")
    return res
  })
}

export async function getAccountPayableFormData() {
  const [suppliers, costCenters, categories, accounts] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, legalName: true, tradeName: true },
      orderBy: { legalName: "asc" }
    }),
    prisma.costCenter.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" }
    }),
    prisma.financialCategory.findMany({
      where: { isActive: true, type: "EXIT" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" }
    }),
    prisma.financialAccount.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" }
    })
  ])

  return { suppliers, costCenters, categories, accounts }
}

export async function savePayable(data: any) {
  const { id, ...rest } = data
  
  const payload = {
    ...rest,
    amount: parseFloat(rest.amount),
    dueDate: new Date(rest.dueDate),
    issueDate: rest.issueDate ? new Date(rest.issueDate) : new Date(),
    status: rest.status || "PENDING",
  }

  if (id) {
    const updated = await prisma.accountPayable.update({
      where: { id },
      data: payload
    })
    revalidatePath("/financeiro/contas-a-pagar")
    return updated
  }

  const created = await prisma.accountPayable.create({
    data: payload
  })
  revalidatePath("/financeiro/contas-a-pagar")
  return created
}

export async function deletePayable(id: string) {
  await prisma.accountPayable.delete({
    where: { id }
  })
  revalidatePath("/financeiro/contas-a-pagar")
}

export async function getBatchPaySummary(cutOffDate: string) {
  const date = new Date(cutOffDate)
  date.setHours(23, 59, 59, 999)

  const pendingTitles = await prisma.accountPayable.findMany({
    where: {
      status: { in: ["PENDING", "PARTIALLY_PAID"] },
      dueDate: { lte: date }
    },
    select: {
      id: true,
      amount: true,
      paidAmount: true,
    }
  })

  const totalAmount = pendingTitles.reduce((acc, t) => acc + (t.amount - (t.paidAmount || 0)), 0)

  return {
    count: pendingTitles.length,
    totalAmount
  }
}

export async function batchPayTitles(data: {
  cutOffDate: string,
  accountId: string,
  paymentDate: string,
  notes?: string
}) {
  const { cutOffDate, accountId, paymentDate, notes } = data
  const dateLimit = new Date(cutOffDate)
  dateLimit.setHours(23, 59, 59, 999)

  const payDate = new Date(paymentDate)

  const pendingTitles = await prisma.accountPayable.findMany({
    where: {
      status: { in: ["PENDING", "PARTIALLY_PAID"] },
      dueDate: { lte: dateLimit }
    }
  })

  if (pendingTitles.length === 0) {
    throw new Error("Nenhum título pendente encontrado para esta data.")
  }

  return await prisma.$transaction(async (tx) => {
    let totalPaid = 0

    for (const title of pendingTitles) {
      const amountToPay = title.amount - (title.paidAmount || 0)
      
      // 1. Atualizar Título
      await tx.accountPayable.update({
        where: { id: title.id },
        data: {
          paidAmount: title.amount,
          status: "PAID",
          paymentDate: payDate,
          financialAccountId: accountId
        }
      })

      // 2. Criar Transação Financeira (Saída)
      const transaction = await tx.financialTransaction.create({
        data: {
          type: "EXIT",
          amount: amountToPay,
          transactionDate: payDate,
          description: `Pagamento em Lote: ${title.description}`,
          status: "CONFIRMED",
          financialAccountId: accountId,
          financialCategoryId: title.financialCategoryId
        }
      })

      // 3. Alocação de Pagamento
      await tx.paymentAllocation.create({
        data: {
          transactionId: transaction.id,
          accountPayableId: title.id,
          amountAllocated: amountToPay
        }
      })

      totalPaid += amountToPay
    }

    // 4. Atualizar Saldo da Conta (Decremento Total)
    await tx.financialAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: { decrement: totalPaid }
      }
    })

    return { count: pendingTitles.length, totalPaid }
  }).then((res) => {
    revalidatePath("/financeiro/dashboard")
    revalidatePath("/financeiro/contas-a-pagar")
    revalidatePath("/financeiro/fluxo-de-caixa")
    return res
  })
}

