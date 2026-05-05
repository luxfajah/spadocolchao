"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCommissionEntries(filters: any = {}) {
  const { sellerId, status, startDate, endDate } = filters
  
  return prisma.commissionEntry.findMany({
    where: {
      sellerId: sellerId || undefined,
      status: status || undefined,
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined
      }
    },
    include: {
      seller: { select: { name: true } },
      sale: { select: { number: true, totalAmount: true, customer: { select: { fullName: true } } } },
      commissionRule: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function updateCommissionStatus(id: string, status: string) {
  try {
    const data: any = { status }
    
    if (status === "APPROVED") data.approvedAt = new Date()
    if (status === "PAID") data.paidAt = new Date()
    
    await prisma.commissionEntry.update({
      where: { id },
      data
    })
    
    revalidatePath("/vendas-clientes/comissoes")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function bulkApproveCommissions(ids: string[]) {
  try {
    await prisma.commissionEntry.updateMany({
      where: { id: { in: ids }, status: "PENDING" },
      data: {
        status: "APPROVED",
        approvedAt: new Date()
      }
    })
    revalidatePath("/vendas-clientes/comissoes")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function bulkPayCommissions(ids: string[]) {
  try {
    await prisma.commissionEntry.updateMany({
      where: { id: { in: ids }, status: "APPROVED" },
      data: {
        status: "PAID",
        paidAt: new Date()
      }
    })
    revalidatePath("/(admin)/vendas-clientes/comissoes")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getCommissionSummary(filters: any = {}) {
  const { sellerId, startDate, endDate } = filters

  const where = {
    sellerId: sellerId || undefined,
    createdAt: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined
    }
  }

  const [pending, approved, paid] = await Promise.all([
    prisma.commissionEntry.aggregate({ where: { ...where, status: "PENDING" }, _sum: { commissionAmount: true } }),
    prisma.commissionEntry.aggregate({ where: { ...where, status: "APPROVED" }, _sum: { commissionAmount: true } }),
    prisma.commissionEntry.aggregate({ where: { ...where, status: "PAID" }, _sum: { commissionAmount: true } })
  ])

  return {
    pending: pending._sum.commissionAmount || 0,
    approved: approved._sum.commissionAmount || 0,
    paid: paid._sum.commissionAmount || 0,
    total: (pending._sum.commissionAmount || 0) + (approved._sum.commissionAmount || 0) + (paid._sum.commissionAmount || 0)
  }
}
