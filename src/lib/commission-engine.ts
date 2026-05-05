import { prisma } from "./prisma"

export interface CalculationContext {
  trigger: "CONFIRMED" | "DELIVERED" | "PAID" | "FINALIZED"
  saleId: string
}

export async function calculateCommissions(context: CalculationContext) {
  const { saleId, trigger } = context

  // 1. Fetch Sale with all necessary relations
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          productService: true
        }
      },
      seller: true,
      leadSource: true
    }
  })

  if (!sale || !sale.sellerId) return { success: false, error: "Sale or Seller not found" }

  // 2. Fetch all Active Rules once
  const allRules = await prisma.commissionRule.findMany({
    where: { isActive: true, appliesOn: trigger },
    include: { conditions: true },
    orderBy: { priority: "desc" }
  })

  // 3. Get Seller Goal for the month
  const saleDate = sale.createdAt || new Date()
  const month = saleDate.getMonth() + 1
  const year = saleDate.getFullYear()

  const sellerGoal = await prisma.sellerGoal.findUnique({
    where: {
      sellerId_referenceMonth_referenceYear: {
        sellerId: sale.sellerId,
        referenceMonth: month,
        referenceYear: year
      }
    }
  })

  // Calculate current performance (achievedPercent)
  // Note: For real-time accuracy, this should ideally be recalculated periodically or on each sale
  const goalPercent = sellerGoal ? (sellerGoal.achievedPercent || 0) : 0

  // Find applicable policy multiplier
  const policies = await prisma.commissionGoalPolicy.findMany({
    where: { isActive: true },
    orderBy: { minGoalPercent: "desc" } // Highest attainment first
  })

  //@ts-ignore
  const matchingPolicy = policies.find((p: any) => goalPercent >= p.minGoalPercent && goalPercent <= p.maxGoalPercent)
  const multiplier = matchingPolicy ? matchingPolicy.multiplier : 1.0

  const commissionEntries: any[] = []

  // 4. Process each item (or the whole sale depending on baseType)
  for (const item of sale.items) {
    // Find the best rule for this item
    const applicableRule = findBestRule(allRules, {
      item,
      sale,
      goalPercent,
      sellerId: sale.sellerId
    })

    if (applicableRule) {
      let baseAmount = 0
      
      // Determine base
      switch (applicableRule.baseType) {
        case "GROSS_SALE": baseAmount = item.totalAmount; break;
        case "NET_SALE": baseAmount = item.totalAmount; break; // Simplified for now
        case "ITEM_BRUTO": baseAmount = item.unitPrice * item.quantity; break;
        case "RECEIVED": baseAmount = sale.paidAmount || 0; break; // Only makes sense for whole sale rules
        default: baseAmount = item.totalAmount
      }

      let commAmount = 0
      if (applicableRule.calculationType === "PERCENTAGE") {
        commAmount = baseAmount * ((applicableRule.percentage || 0) / 100)
      } else if (applicableRule.calculationType === "FIXED") {
        commAmount = applicableRule.fixedAmount || 0
      } else if (applicableRule.calculationType === "HYBRID") {
        commAmount = (baseAmount * ((applicableRule.percentage || 0) / 100)) + (applicableRule.fixedAmount || 0)
      }

      // Apply Multiplier from Goal
      const finalCommAmount = commAmount * multiplier

      commissionEntries.push({
        saleId: sale.id,
        sellerId: sale.sellerId,
        commissionRuleId: applicableRule.id,
        baseAmount,
        percentageApplied: applicableRule.percentage,
        fixedAmountApplied: applicableRule.fixedAmount,
        multiplierApplied: multiplier,
        commissionAmount: finalCommAmount,
        goalPercentAtCalculation: goalPercent,
        leadSourceAtCalculation: sale.leadSource?.name,
        productAtCalculation: item.productService?.name,
        status: "PENDING",
        notes: `Calculado via regra: ${applicableRule.name}. Meta atingida: ${goalPercent.toFixed(1)}%.`
      })
    }
  }

  // 5. Bulk create entries (in a transaction)
  if (commissionEntries.length > 0) {
    await prisma.$transaction([
        // Clear existing pending commissions for this sale/trigger and specific rules to avoid duplication
        prisma.commissionEntry.deleteMany({
            where: { saleId: sale.id, status: "PENDING" }
        }),
        prisma.commissionEntry.createMany({
            data: commissionEntries
        })
    ])
  }

  return { success: true, count: commissionEntries.length }
}

export async function approveSaleCommissions(saleId: string) {
  const pendingCount = await prisma.commissionEntry.count({
    where: { saleId, status: "PENDING" },
  })

  if (pendingCount === 0) {
    await calculateCommissions({ saleId, trigger: "CONFIRMED" })
  }

  const approvedAt = new Date()
  const result = await prisma.commissionEntry.updateMany({
    where: { saleId, status: "PENDING" },
    data: {
      status: "APPROVED",
      approvedAt,
    },
  })

  return { success: true, count: result.count }
}

/**
 * Helper to match rules based on conditions
 * Rules are already sorted by priority (desc)
 */
function findBestRule(rules: any[], context: any) {
  const { item, sale, goalPercent, sellerId } = context

  for (const rule of rules) {
    if (rule.conditions.length === 0) return rule // No conditions = default catch-all

    let allMatch = true
    for (const condition of rule.conditions) {
      const { conditionType, operator, value } = condition
      
      let matched = false
      switch (conditionType) {
        case "LEAD_SOURCE":
          matched = compare(sale.leadSourceId, operator, value);
          break;
        case "PRODUCT_SERVICE":
          matched = compare(item.productServiceId, operator, value);
          break;
        case "PRODUCT_CATEGORY":
          matched = compare(item.productService?.operationalCategory, operator, value);
          break;
        case "SELLER":
          matched = compare(sellerId, operator, value);
          break;
        case "GOAL_PERCENTAGE":
          matched = compare(goalPercent, operator, Number(value));
          break;
        case "MIN_SALE_AMOUNT":
          matched = sale.totalAmount >= Number(value);
          break;
      }

      if (!matched) {
        allMatch = false
        break
      }
    }

    if (allMatch) return rule
  }

  return null
}

function compare(actual: any, operator: string, target: any) {
  switch (operator) {
    case "EQUALS": return actual === target;
    case "GTE": return actual >= target;
    case "LTE": return actual <= target;
    case "IN": {
        try {
            const list = JSON.parse(target)
            return Array.isArray(list) && list.includes(actual)
        } catch {
            return String(target).split(',').map(s => s.trim()).includes(String(actual))
        }
    }
    default: return false;
  }
}
