import { prisma } from "@/lib/prisma"

export interface FinancialBaselineMetrics {
  periodLabel: string
  totalSalesCount: number
  totalPiecesSold: number
  totalRevenue: number
  
  // Combustível / Frota
  fuel: {
    monthlyTotal: number
    costPerPiece: number
    costPerSale: number
    description: string
  }

  // Tráfego Pago & Marketing
  marketing: {
    monthlyTotal: number
    metaAdsSpend: number
    teamSpend: {
      ozaila: number
      leslie: number
      totalTeam: number
    }
    costPerSaleCAC: number
    percentOfRevenue: number
    description: string
  }

  // Custos Fixos / Estrutura da Empresa
  overhead: {
    monthlyTotal: number
    costPerPieceCapacity330: number // 15 reformas completas/dia = 330/mês
    costPerPieceCapacity1320: number // 30 colchões + 30 box/dia = 1320/mês
    costPerPieceHistorical: number
    percentOfRevenue: number
    description: string
  }

  // Mão de Obra Direta (MOD)
  productionMOD: {
    activeWorkersCount: number
    monthlyPayrollWithCharges: number
    hourlyRate: number
    minuteRate: number
    description: string
  }

  // Parâmetros de Venda Padrão
  commercialDefaults: {
    taxRatePercent: number // Simples Nacional (ex: 6%)
    cardFeeRatePercent: number // Maquininha (ex: 3.5%)
    salesCommissionPercent: number // Comissão vendedores (ex: 3.0%)
  }
}

/**
 * Agrega e calcula as métricas reais do setor financeiro:
 * - Contas a pagar de Combustível / Posto
 * - Meta Ads + Equipe de Marketing PJ (Ozaila R$ 2.200 + Leslie R$ 3.000)
 * - Custos fixos do galpão (Aluguel, Energia, Água, Internet, Contador, Pró-Labore)
 * - Folha de pagamento da equipe de produção com encargos
 * - Vendas e peças totais realizadas
 */
export async function getPricingFinancialBaseline(): Promise<FinancialBaselineMetrics> {
  try {
    // 1. Vendas e volume de peças (considerando histórico recente consolidado)
    const sales = await prisma.sale.findMany({
      where: { status: { not: "CANCELLED" } },
      select: {
        id: true,
        totalAmount: true,
        saleDate: true,
        items: { select: { quantity: true } }
      }
    })

    const totalSalesCount = sales.length || 1
    const totalPiecesSold = sales.reduce((acc, s) => {
      const q = s.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      return acc + (q || 1)
    }, 0) || 1
    const totalRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0)

    // 2. Contas a pagar para identificar os custos de Combustível, Marketing e Estrutura
    const payables = await prisma.accountPayable.findMany({
      select: {
        amount: true,
        description: true,
        dueDate: true,
        financialCategory: { select: { name: true, type: true } }
      }
    })

    // Combustível / Posto
    const fuelPayables = payables.filter(p => {
      const desc = (p.description || "").toLowerCase()
      const cat = (p.financialCategory?.name || "").toLowerCase()
      return (
        desc.includes("posto") ||
        desc.includes("combustivel") ||
        desc.includes("combustível") ||
        desc.includes("diesel") ||
        desc.includes("gasolina") ||
        cat.includes("combustível") ||
        cat.includes("diesel")
      )
    })
    const totalFuelAmount = fuelPayables.reduce((acc, p) => acc + (p.amount || 0), 0)
    // Média mensal (tomando como base o histórico ativo de ~6 meses ou histórico por peça)
    const monthlyFuelEstimated = fuelPayables.length >= 6 ? (totalFuelAmount / (fuelPayables.length / 2)) : 8000
    const fuelCostPerPiece = totalPiecesSold > 0 ? (totalFuelAmount / totalPiecesSold) : 63.50
    const fuelCostPerSale = totalSalesCount > 0 ? (totalFuelAmount / totalSalesCount) : 69.10

    // Meta Ads & Transações
    const metaTransactions = await prisma.financialTransaction.findMany({
      where: {
        OR: [
          { description: { contains: "meta", mode: "insensitive" } },
          { description: { contains: "facebook", mode: "insensitive" } }
        ]
      },
      select: { amount: true }
    })
    const totalMetaDirect = metaTransactions.reduce((acc, t) => acc + (t.amount || 0), 0)
    const monthlyMetaDirect = totalMetaDirect > 0 ? (totalMetaDirect / 2) : 4900 // Média mensal de anúncios

    // Equipe PJ Marketing: Ozaila (R$ 2.200) + Leslie (R$ 3.000)
    const ozailaMonthly = 2200
    const leslieMonthly = 3000
    const marketingTeamTotalMonthly = ozailaMonthly + leslieMonthly

    const monthlyMarketingTotal = monthlyMetaDirect + marketingTeamTotalMonthly
    const marketingCostPerSaleCAC = totalSalesCount > 0 
      ? ((totalMetaDirect + (marketingTeamTotalMonthly * 6)) / totalSalesCount) 
      : (monthlyMarketingTotal / (totalSalesCount / 6 || 100))
    const marketingPercentOfRevenue = totalRevenue > 0 
      ? (((totalMetaDirect + (marketingTeamTotalMonthly * 6)) / totalRevenue) * 100)
      : 4.5

    // Custos Fixos / Estrutura da Empresa (Aluguel, Luz, Água, Internet, Contador, Pró-Labore)
    const overheadPayables = payables.filter(p => {
      const desc = (p.description || "").toLowerCase()
      const cat = (p.financialCategory?.name || "").toLowerCase()
      return (
        desc.includes("aluguel") ||
        desc.includes("luz") ||
        desc.includes("energia") ||
        desc.includes("água") ||
        desc.includes("agua") ||
        desc.includes("internet") ||
        desc.includes("contador") ||
        desc.includes("contabil") ||
        desc.includes("contábil") ||
        desc.includes("pró-labore") ||
        desc.includes("pro-labore") ||
        cat.includes("aluguel") ||
        cat.includes("energia") ||
        cat.includes("contador")
      )
    })
    const totalOverheadAmount = overheadPayables.reduce((acc, p) => acc + (p.amount || 0), 0)
    const monthlyOverhead = overheadPayables.length >= 6 ? (totalOverheadAmount / 6) : 21000

    // Rateio de Overhead:
    // Capacidade A: 330 reformas completas/mês (15/dia x 22 dias)
    const costPerPieceCap330 = monthlyOverhead / 330
    // Capacidade B: 1320 produtos novos/mês (30 colchões + 30 box/dia x 22 dias com +1 marceneiro)
    const costPerPieceCap1320 = monthlyOverhead / 1320
    const costPerPieceHistorical = totalPiecesSold > 0 ? (totalOverheadAmount / totalPiecesSold) : 280

    // 3. Mão de Obra Direta (MOD) da Fábrica
    const prodEmployees = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { department: { contains: "Produção", mode: "insensitive" } },
          { department: null }
        ]
      },
      select: { salaryBase: true }
    })
    const basePayroll = prodEmployees.reduce((acc, e) => acc + (e.salaryBase || 0), 0) || 10500
    // 45% de provisões de encargos trabalhistas, FGTS, férias, 13º e benefícios
    const payrollWithCharges = basePayroll * 1.45
    const workingHoursPerMonth = 176 // 22 dias x 8h
    const hourlyRate = workingHoursPerMonth > 0 ? payrollWithCharges / workingHoursPerMonth : 86.50
    const minuteRate = hourlyRate / 60

    return {
      periodLabel: "Consolidado Financeiro (Setembro / Outubro)",
      totalSalesCount,
      totalPiecesSold,
      totalRevenue,
      fuel: {
        monthlyTotal: monthlyFuelEstimated,
        costPerPiece: Number(fuelCostPerPiece.toFixed(2)),
        costPerSale: Number(fuelCostPerSale.toFixed(2)),
        description: "Média de gastos com Auto Posto / Frota rateado por unidade vendida"
      },
      marketing: {
        monthlyTotal: monthlyMarketingTotal,
        metaAdsSpend: monthlyMetaDirect,
        teamSpend: {
          ozaila: ozailaMonthly,
          leslie: leslieMonthly,
          totalTeam: marketingTeamTotalMonthly
        },
        costPerSaleCAC: Number(marketingCostPerSaleCAC.toFixed(2)),
        percentOfRevenue: Number(marketingPercentOfRevenue.toFixed(2)),
        description: "Meta Ads + Equipe PJ (Ozaila R$ 2.200 + Leslie R$ 3.000)"
      },
      overhead: {
        monthlyTotal: Number(monthlyOverhead.toFixed(2)),
        costPerPieceCapacity330: Number(costPerPieceCap330.toFixed(2)),
        costPerPieceCapacity1320: Number(costPerPieceCap1320.toFixed(2)),
        costPerPieceHistorical: Number(costPerPieceHistorical.toFixed(2)),
        percentOfRevenue: totalRevenue > 0 ? Number(((monthlyOverhead * 6 / totalRevenue) * 100).toFixed(2)) : 12.0,
        description: "Aluguel, Luz, Água, Internet, Contador e Pró-Labore rateados pela capacidade fabril"
      },
      productionMOD: {
        activeWorkersCount: prodEmployees.length || 4,
        monthlyPayrollWithCharges: Number(payrollWithCharges.toFixed(2)),
        hourlyRate: Number(hourlyRate.toFixed(2)),
        minuteRate: Number(minuteRate.toFixed(2)),
        description: "Custo por minuto da equipe de corte, costura, marcenaria e tapeçaria"
      },
      commercialDefaults: {
        taxRatePercent: 6.0, // Simples Nacional médio
        cardFeeRatePercent: 3.5, // Média taxas de cartão / antecipação
        salesCommissionPercent: 3.0 // Comissão de vendas média
      }
    }
  } catch (err) {
    console.error("Erro ao carregar métricas financeiras de precificação:", err)
    // Fallback seguro caso haja problema transitório no banco
    return {
      periodLabel: "Estimativa Padrão Industrial",
      totalSalesCount: 105,
      totalPiecesSold: 116,
      totalRevenue: 187610,
      fuel: {
        monthlyTotal: 8566,
        costPerPiece: 73.85,
        costPerSale: 81.58,
        description: "Média baseada em Auto Posto"
      },
      marketing: {
        monthlyTotal: 8200,
        metaAdsSpend: 3000,
        teamSpend: {
          ozaila: 2200,
          leslie: 3000,
          totalTeam: 5200
        },
        costPerSaleCAC: 55.0,
        percentOfRevenue: 4.37,
        description: "Meta Ads + Equipe PJ (Ozaila R$ 2.200 + Leslie R$ 3.000)"
      },
      overhead: {
        monthlyTotal: 20970,
        costPerPieceCapacity330: 63.55,
        costPerPieceCapacity1320: 15.88,
        costPerPieceHistorical: 180.77,
        percentOfRevenue: 11.17,
        description: "Estrutura do galpão rateada pela capacidade"
      },
      productionMOD: {
        activeWorkersCount: 4,
        monthlyPayrollWithCharges: 15225,
        hourlyRate: 86.51,
        minuteRate: 1.44,
        description: "Custo por minuto de fábrica"
      },
      commercialDefaults: {
        taxRatePercent: 6.0,
        cardFeeRatePercent: 3.5,
        salesCommissionPercent: 3.0
      }
    }
  }
}
