import { prisma } from '@/lib/prisma'


import { Prisma } from '@prisma/client'

export async function getSalesSummary() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [
    todaySales,
    monthSales,
    pendingPayments,
    paidSales,
    cancelledSales
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { saleDate: { gte: today }, status: 'CONFIRMED' },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: firstDayOfMonth }, status: 'CONFIRMED' },
      _sum: { totalAmount: true },
      _count: true
    }),
    prisma.sale.aggregate({
      where: { financialStatus: 'PENDING', status: 'CONFIRMED' },
      _sum: { totalAmount: true }
    }),
    prisma.sale.aggregate({
      where: { financialStatus: 'PAID', status: 'CONFIRMED' },
      _sum: { totalAmount: true }
    }),
    prisma.sale.count({
      where: { status: 'CANCELLED' }
    })
  ])

  const ticketMedio = todaySales._count > 0 ? (todaySales._sum.totalAmount || 0) / todaySales._count : 0

  return {
    todayTotal: todaySales._sum.totalAmount || 0,
    monthTotal: monthSales._sum.totalAmount || 0,
    ticketMedio,
    pendingTotal: pendingPayments._sum.totalAmount || 0,
    paidTotal: paidSales._sum.totalAmount || 0,
    cancelledCount: cancelledSales
  }
}

export async function getSales(filters: {
  startDate?: Date,
  endDate?: Date,
  customerId?: string,
  sellerId?: string,
  leadSourceId?: string,
  status?: string,
  financialStatus?: string,
}) {
  const where: Prisma.SaleWhereInput = {}

  if (filters.startDate || filters.endDate) {
    where.saleDate = {}
    if (filters.startDate) where.saleDate.gte = filters.startDate
    if (filters.endDate) where.saleDate.lte = filters.endDate
  }

  if (filters.customerId) where.customerId = filters.customerId
  if (filters.sellerId) where.sellerId = filters.sellerId
  if (filters.leadSourceId) where.leadSourceId = filters.leadSourceId
  if (filters.status) where.status = filters.status
  if (filters.financialStatus) where.financialStatus = filters.financialStatus

  return prisma.sale.findMany({
    where,
    include: {
      customer: { select: { fullName: true } },
      seller: { select: { name: true } },
      leadSource: { select: { name: true } },
      _count: { select: { items: true } },
      order: { select: { id: true, code: true } }
    },
    orderBy: { saleDate: 'desc' }
  })
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          addresses: true,
          contacts: true
        }
      },
      seller: true,
      leadSource: true,
      items: {
        include: {
          productService: true,
          detailMattressReform: true,
          detailBoxReform: true,
          detailNewMattress: true,
          detailNewBox: true,
          detailUpholsteryCleaning: true
        }
      },
      installments: {
        include: {
          paymentMethod: true
        }
      },
      order: true,
      commissions: {
        include: {
          seller: true,
          commissionRule: true
        }
      }
    }
  })
}

export async function updateSaleStatus(id: string, status: string, userId: string) {
  return prisma.sale.update({
    where: { id },
    data: { 
      status,
      updatedAt: new Date()
    }
  })
}

export async function cancelSale(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
        financialStatus: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: userId
      }
    })

    // Se houver pedido vinculado, cancela também
    await tx.order.updateMany({
      where: { saleId: id },
      data: { 
        currentStatus: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: userId
      }
    })

    return sale
  })
}
