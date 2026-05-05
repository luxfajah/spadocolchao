"use server"

import { prisma } from "@/lib/prisma"

export async function getCashFlow(filters: any = {}) {
  const { accountId, categoryId, type, startDate, endDate, query } = filters

  const where: any = {
    status: "CONFIRMED"
  }

  if (accountId && accountId !== "ALL") {
    where.financialAccountId = accountId
  }

  if (categoryId && categoryId !== "ALL") {
    where.financialCategoryId = categoryId
  }

  if (type && type !== "ALL") {
    where.type = type
  }

  if (startDate || endDate) {
    where.transactionDate = {}
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      where.transactionDate.gte = start
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.transactionDate.lte = end
    }
  }

  if (query) {
    where.OR = [
      { description: { contains: query } },
      { notes: { contains: query } }
    ]
  }

  return await prisma.financialTransaction.findMany({
    where,
    include: {
      financialAccount: { select: { name: true } },
      financialCategory: { select: { name: true } },
      performedBy: { select: { name: true } }
    },
    orderBy: { transactionDate: "desc" }
  })
}

export async function getCashFlowMetadata() {
  const [accounts, categories] = await Promise.all([
    prisma.financialAccount.findMany({ where: { status: "ACTIVE" } }),
    prisma.financialCategory.findMany({ where: { isActive: true } })
  ])

  return { accounts, categories }
}
