"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays, addDays, startOfMonth, endOfMonth } from "date-fns"

export async function getFinancialDashboardData() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  // 1. Saldos Consolidados
  const accounts = await prisma.financialAccount.findMany({
    where: { status: "ACTIVE" }
  })
  
  const totalBalance = accounts.reduce((acc: number, a: { currentBalance: number }) => acc + a.currentBalance, 0)
  const cashBalance = accounts.filter((a: { type: string }) => a.type === "CASH").reduce((acc: number, a: { currentBalance: number }) => acc + a.currentBalance, 0)
  const bankBalance = accounts.filter((a: { type: string }) => a.type === "BANK").reduce((acc: number, a: { currentBalance: number }) => acc + a.currentBalance, 0)

  // 2. Contas a Receber (Em Aberto)
  const receivables = await prisma.accountReceivable.findMany({
    where: {
      status: { in: ["PENDING", "PARTIALLY_RECEIVED", "OVERDUE"] }
    }
  })
  
  const totalReceivable = receivables.reduce((acc: number, r: { amount: number, paidAmount: number }) => acc + (r.amount - r.paidAmount), 0)
  const overdueReceivable = receivables
    .filter((r: { status: string, dueDate: Date, paidAmount: number, amount: number }) => r.status === "OVERDUE" || (r.dueDate < todayStart && r.paidAmount < r.amount))
    .reduce((acc: number, r: { amount: number, paidAmount: number }) => acc + (r.amount - r.paidAmount), 0)

  // 3. Contas a Pagar (Em Aberto)
  const payables = await prisma.accountPayable.findMany({
    where: {
      status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] }
    }
  })
  
  const totalPayable = payables.reduce((acc: number, p: { amount: number, paidAmount: number }) => acc + (p.amount - p.paidAmount), 0)

  // 4. Movimentações de Hoje
  const todayTransactions = await prisma.financialTransaction.findMany({
    where: {
      transactionDate: { gte: todayStart, lte: todayEnd },
      status: "CONFIRMED"
    }
  })
  
  const todayEntries = todayTransactions
    .filter((t: { type: string, isTransfer: boolean }) => t.type === "ENTRY" && !t.isTransfer)
    .reduce((acc: number, t: { amount: number }) => acc + t.amount, 0)
    
  const todayExits = todayTransactions
    .filter((t: { type: string, isTransfer: boolean }) => t.type === "EXIT" && !t.isTransfer)
    .reduce((acc: number, t: { amount: number }) => acc + t.amount, 0)

  // 5. Lucro Operacional (Mês Atual)
  const monthTransactions = await prisma.financialTransaction.findMany({
    where: {
      transactionDate: { gte: monthStart, lte: monthEnd },
      status: "CONFIRMED",
      isTransfer: false
    }
  })
  
  const monthEntries = monthTransactions.filter((t: { type: string }) => t.type === "ENTRY").reduce((acc: number, t: { amount: number }) => acc + t.amount, 0)
  const monthExits = monthTransactions.filter((t: { type: string }) => t.type === "EXIT").reduce((acc: number, t: { amount: number }) => acc + t.amount, 0)
  const operatingProfit = monthEntries - monthExits

  // 6. Previsão 30 dias (Simplificada: Recebíveis + Pagáveis por data)
  const forecastDate = addDays(now, 30)
  const upcomingReceivables = await prisma.accountReceivable.findMany({
    where: {
      dueDate: { gte: todayStart, lte: forecastDate },
      status: { in: ["PENDING", "PARTIALLY_RECEIVED"] }
    }
  })
  
  const upcomingPayables = await prisma.accountPayable.findMany({
    where: {
      dueDate: { gte: todayStart, lte: forecastDate },
      status: { in: ["PENDING", "PARTIALLY_PAID"] }
    }
  })

  // 7. Dados para Gráfico (Últimos 15 dias)
  const last15Days = Array.from({ length: 15 }, (_, i) => {
    const d = subDays(todayEnd, 14 - i)
    return {
      date: d,
      display: d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' }),
      entries: 0,
      exits: 0
    }
  })

  // Preencher gráfico com dados reais do mês
  const transactionsForChart = await prisma.financialTransaction.findMany({
    where: {
      transactionDate: { gte: subDays(todayStart, 14) },
      status: "CONFIRMED",
      isTransfer: false
    }
  })

  transactionsForChart.forEach(t => {
    const dayStr = t.transactionDate.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })
    const dayData = last15Days.find(d => d.display === dayStr)
    if (dayData) {
      if (t.type === "ENTRY") dayData.entries += t.amount
      else dayData.exits += t.amount
    }
  })

  return {
    summary: {
      totalBalance,
      cashBalance,
      bankBalance,
      totalReceivable,
      overdueReceivable,
      totalPayable,
      todayEntries,
      todayExits,
      operatingProfit,
    },
    accounts: accounts.map(a => ({
      id: a.id,
      name: a.name,
      balance: a.currentBalance,
      type: a.type
    })),
    chartData: last15Days,
    recentTitles: {
      receivables: receivables.slice(0, 5),
      payables: payables.slice(0, 5)
    }
  }
}
