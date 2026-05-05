"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ruleSchema = z.object({
  name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  description: z.string().optional(),
  priority: z.number().default(0),
  calculationType: z.enum(["PERCENTAGE", "FIXED", "HYBRID"]),
  baseType: z.enum(["GROSS_SALE", "NET_SALE", "ITEM_BRUTO", "ITEM_LIQUIDO", "RECEIVED", "PAID"]),
  percentage: z.number().nullable().optional(),
  fixedAmount: z.number().nullable().optional(),
  isActive: z.boolean().default(true),
  validFrom: z.string().nullable().optional(),
  validTo: z.string().nullable().optional(),
  appliesOn: z.enum(["CONFIRMED", "DELIVERED", "PAID", "FINALIZED"]),
  conditions: z.array(z.object({
    conditionType: z.string(),
    operator: z.string(),
    value: z.string()
  })).default([])
})

export async function getCommissionRules() {
  return prisma.commissionRule.findMany({
    include: {
      conditions: true
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

export async function upsertCommissionRule(id: string | null, data: any) {
  try {
    const validated = ruleSchema.parse(data)
    const { conditions, ...ruleData } = validated

    const result = await prisma.$transaction(async (tx) => {
      let rule
      if (id) {
        // Update
        rule = await tx.commissionRule.update({
          where: { id },
          data: {
            ...ruleData,
            validFrom: ruleData.validFrom ? new Date(ruleData.validFrom) : null,
            validTo: ruleData.validTo ? new Date(ruleData.validTo) : null,
            conditions: {
              deleteMany: {},
              create: conditions
            }
          }
        })
      } else {
        // Create
        rule = await tx.commissionRule.create({
          data: {
            ...ruleData,
            validFrom: ruleData.validFrom ? new Date(ruleData.validFrom) : null,
            validTo: ruleData.validTo ? new Date(ruleData.validTo) : null,
            conditions: {
              create: conditions
            }
          }
        })
      }
      return rule
    })

    revalidatePath("/configuracoes/regras-de-comissao")
    return { success: true, rule: result }
  } catch (error: any) {
    console.error("Commission Rule Error:", error)
    return { success: false, error: error.message || "Erro ao salvar regra" }
  }
}

export async function deleteCommissionRule(id: string) {
  try {
    await prisma.commissionRule.delete({ where: { id } })
    revalidatePath("/configuracoes/regras-de-comissao")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Meta actions
export async function getSellerGoals(month: number, year: number) {
  return prisma.sellerGoal.findMany({
    where: { referenceMonth: month, referenceYear: year },
    include: {
      seller: { select: { name: true } }
    }
  })
}

export async function upsertSellerGoal(data: any) {
    try {
        const result = await prisma.sellerGoal.upsert({
            where: {
                sellerId_referenceMonth_referenceYear: {
                    sellerId: data.sellerId,
                    referenceMonth: data.referenceMonth,
                    referenceYear: data.referenceYear
                }
            },
            update: {
                targetAmount: data.targetAmount,
                status: data.status || "OPEN"
            },
            create: {
                sellerId: data.sellerId,
                referenceMonth: data.referenceMonth,
                referenceYear: data.referenceYear,
                targetAmount: data.targetAmount,
                status: "OPEN"
            }
        })
        revalidatePath("/configuracoes/regras-de-comissao")
        return { success: true, goal: result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// Policy actions
export async function getGoalPolicies() {
    return prisma.commissionGoalPolicy.findMany({
        orderBy: { minGoalPercent: 'asc' }
    })
}

export async function upsertGoalPolicy(id: string | null, data: any) {
    try {
        const result = id 
            ? await prisma.commissionGoalPolicy.update({ where: { id }, data })
            : await prisma.commissionGoalPolicy.create({ data })
        
        revalidatePath("/configuracoes/regras-de-comissao")
        return { success: true, policy: result }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteGoalPolicy(id: string) {
    try {
        await prisma.commissionGoalPolicy.delete({ where: { id } })
        revalidatePath("/configuracoes/regras-de-comissao")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
