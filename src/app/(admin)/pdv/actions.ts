"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomUUID } from "node:crypto"
import { generateMaterialRequirementsForReform } from "@/lib/services/technical-sheet"
import { calculateCommissions } from "@/lib/commission-engine"
import { getPdvSellerOptions } from "@/lib/pdv-sellers"
import { getAuthenticatedUser } from "@/lib/auth"
import { assertAreaAccess } from "@/lib/access-control"

async function requirePdvActor() {
  const actor = await getAuthenticatedUser()

  if (!actor) {
    throw new Error("Usuário não autenticado.")
  }

  await assertAreaAccess(actor, "pdv")
  return actor
}

// 1. Fetch real initial data for the POS
export async function getInitialPdvData() {
  const actor = await requirePdvActor()
  const [customers, sellers, leadSources, paymentMethods, products, supplyItems] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, fullName: true, document: true } }),
    getPdvSellerOptions(),
    prisma.leadSource.findMany({ 
      where: { isActive: true }, 
      select: { id: true, name: true, requiresDetail: true, isDefaultPdv: true, priority: true },
      orderBy: { priority: "desc" }
    }),
    prisma.paymentMethod.findMany({ select: { id: true, name: true, code: true, allowsInstallments: true, maxInstallments: true } }),
    prisma.productService.findMany({ select: { id: true, name: true, type: true, operationalCategory: true, defaultPrice: true, description: true } }),
    prisma.supplyItem.findMany({ 
      where: { isActive: true, currentStock: { gt: 0 } },
      select: { id: true, name: true, currentStock: true, unit: true, category: { select: { name: true } } },
      orderBy: { name: 'asc' }
    })
  ])

  // Get or Create Open Cash Session for the day to avoid crash
  const adminUser = actor

  let session = await prisma.cashRegisterSession.findFirst({
    where: { status: "OPEN" }
  })

  if (!session) {
    session = await prisma.cashRegisterSession.create({
      data: {
        openedById: adminUser.id,
        openingBalance: 100, // Caixa inicial mock
        status: "OPEN"
      }
    })
  }

  return { customers, sellers, leadSources, paymentMethods, products, session, supplyItems }
}

// 2. Finalization process
export async function finalizeSale(payload: any) {
  try {
    const actor = await requirePdvActor()
    const { 
      customerId, sellerId, leadSourceId, sessionId,
      items, subtotal, globalDiscount, total, 
      payments, notes,
      deliveryDate, recipientName, recipientPhone,
      leadSourceDetail, campaignName, referralName, externalSellerName
    } = payload

    if (!customerId) throw new Error("Selecione um cliente.")
    if (!leadSourceId) throw new Error("Selecione uma origem de venda.")
    if (items.length === 0) throw new Error("Adicione itens à venda.")

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base Sale
      const sale = await tx.sale.create({
        data: {
          number: 'VEND-' + Math.floor(100000 + Math.random() * 900000).toString(),
          customerId,
          sellerId: sellerId || null,
          leadSourceId,
          cashRegisterSessionId: sessionId,
          subtotalAmount: subtotal,
          discountAmount: globalDiscount,
          totalAmount: total,
          status: "CONFIRMED",
          financialStatus: "PENDING",
          notes: notes || null,
          leadSourceDetail: leadSourceDetail || null,
          campaignName: campaignName || null,
          referralName: referralName || null,
          externalSellerName: externalSellerName || null
        }
      })

      // 2. Create Items & Specific details
      for (const item of items) {
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productServiceId: item.productServiceId,
            description: item.name,
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount
          }
        })

        // Hook up detailed tables using type category
        // In our POS, type matches category text. 
        if (item.type === 'Reforma Colchão' || item.type === 'Reforma de colchão') {
          await tx.saleItemDetailMattressReform.create({
            data: {
              saleItemId: saleItem.id,
              serviceType: item.details.serviceType || 'simples',
              commercialSize: item.details.commercialSize || 'casal',
              actualWidth: Number(item.details.actualWidth) || 0,
              actualLength: Number(item.details.actualLength) || 0,
              actualHeight: Number(item.details.actualHeight) || 0,
              mattressType: item.details.mattressType || 'espuma',
              density: item.details.density || null,
              
              optTotalReplacement: item.details.optTotalReplacement || false,
              optFoamStructReinforce: item.details.optFoamStructReinforce || false,
              optRegluing: item.details.optRegluing || false,
              optSpringSystemRepl: item.details.optSpringSystemRepl || false,
              optSpringSystemRepair: item.details.optSpringSystemRepair || false,
              optFullFabricRepl: item.details.optFullFabricRepl || false,
              topFabricSupplyItemId: item.details.topFabricId || null,
              sideFabricSupplyItemId: item.details.sideFabricId || null,
              bottomFabricSupplyItemId: item.details.bottomFabricId || null,
              topFabricColor: item.details.topColor || null,
              sideFabricColor: item.details.sideColor || null,
              
              foamServiceType: item.details.foamServiceType || 'NENHUM',
              foamSupplyItemId: item.details.foamSupplyItemId || null,
              addedFoamHeight: item.details.addedFoamHeight ? Number(item.details.addedFoamHeight) : null,
              tapeSupplyItemId: item.details.tapeSupplyItemId || null,
              feetSupplyItemId: item.details.feetSupplyItemId || null,

              technicalNotes: item.details.technicalNotes || null
            }
          })

          await generateMaterialRequirementsForReform(tx, saleItem.id, {
            serviceType: item.details.serviceType || 'simples',
            actualWidth: Number(item.details.actualWidth) || 0,
            actualLength: Number(item.details.actualLength) || 0,
            actualHeight: Number(item.details.actualHeight) || 0,
            topFabricSupplyItemId: item.details.topFabricId || null,
            sideFabricSupplyItemId: item.details.sideFabricId || null,
            bottomFabricSupplyItemId: item.details.bottomFabricId || null,
            optWaterproofing: item.details.optWaterproofing || false,
            
            foamServiceType: item.details.foamServiceType || 'NENHUM',
            foamSupplyItemId: item.details.foamSupplyItemId || null,
            addedFoamHeight: item.details.addedFoamHeight ? Number(item.details.addedFoamHeight) : null,
            
            tapeSupplyItemId: item.details.tapeSupplyItemId || null,
            feetSupplyItemId: item.details.feetSupplyItemId || null
          })

        } else if (item.type === 'Reforma Box' || item.type === 'Reforma de box') {
          await tx.saleItemDetailBoxReform.create({
            data: {
              saleItemId: saleItem.id,
              serviceType: item.details.serviceType || 'simples',
              boxType: item.details.boxType || 'comum',
              commercialSize: item.details.commercialSize || 'casal',
              actualWidth: Number(item.details.actualWidth) || 0,
              actualLength: Number(item.details.actualLength) || 0,
              actualHeight: Number(item.details.actualHeight) || 0,
              optStructureReinforce: item.details.optStructureReinforce || false,
              optHardwareReplacement: item.details.optHardwareReplacement || false,
              optFullFabricRepl: item.details.optFullFabricRepl || false,
              topFabricSupplyItemId: item.details.topFabricId || null,
              sideFabricSupplyItemId: item.details.sideFabricId || null,
              topFabricColor: item.details.topColor || null,
              sideFabricColor: item.details.sideColor || null,
              
              tapeSupplyItemId: item.details.tapeSupplyItemId || null,
              feetSupplyItemId: item.details.feetSupplyItemId || null,

              technicalNotes: item.details.technicalNotes || null
            }
          })

          await generateMaterialRequirementsForReform(tx, saleItem.id, {
            serviceType: item.details.serviceType || 'simples',
            actualWidth: Number(item.details.actualWidth) || 0,
            actualLength: Number(item.details.actualLength) || 0,
            actualHeight: Number(item.details.actualHeight) || 0,
            topFabricSupplyItemId: item.details.topFabricId || null,
            sideFabricSupplyItemId: item.details.sideFabricId || null,
            optWaterproofing: item.details.optWaterproofing || false,
            
            tapeSupplyItemId: item.details.tapeSupplyItemId || null,
            feetSupplyItemId: item.details.feetSupplyItemId || null
          })

        } else if (item.type === 'Colchão Novo' || item.type === 'Colchão novo') {
          await tx.saleItemDetailNewMattress.create({
            data: {
              saleItemId: saleItem.id,
              commercialSize: item.details.commercialSize || 'casal',
              actualWidth: Number(item.details.actualWidth) || 0,
              actualLength: Number(item.details.actualLength) || 0,
              actualHeight: Number(item.details.actualHeight) || 0,
              mattressType: item.details.mattressType || 'espuma',
              density: item.details.density || null,
              
              topFabricSupplyItemId: item.details.topFabricId || null,
              bottomFabricSupplyItemId: item.details.bottomFabricId || null,
              sideFabricSupplyItemId: item.details.sideFabricId || null,
              
              foamSupplyItemId: item.details.foamSupplyItemId || null,
              tapeSupplyItemId: item.details.tapeSupplyItemId || null,
              feetSupplyItemId: item.details.feetSupplyItemId || null,

              technicalNotes: item.details.technicalNotes || null
            }
          })

          // Calcular material (Usa a mesma lógica por M2 / Metragem / Volume)
          await generateMaterialRequirementsForReform(tx, saleItem.id, {
            serviceType: 'producao',
            actualWidth: Number(item.details.actualWidth) || 0,
            actualLength: Number(item.details.actualLength) || 0,
            actualHeight: Number(item.details.actualHeight) || 0,
            topFabricSupplyItemId: item.details.topFabricId || null,
            sideFabricSupplyItemId: item.details.sideFabricId || null,
            bottomFabricSupplyItemId: item.details.bottomFabricId || null,
            
            foamServiceType: item.details.foamSupplyItemId ? 'TROCA_TOTAL' : 'NENHUM',
            foamSupplyItemId: item.details.foamSupplyItemId || null,
            
            tapeSupplyItemId: item.details.tapeSupplyItemId || null
          })
        } else if (item.type === 'Box Novo' || item.type === 'Box novo') {
           await tx.saleItemDetailNewBox.create({
            data: {
              saleItemId: saleItem.id,
              boxType: item.details.boxType || 'comum',
              commercialSize: item.details.commercialSize || 'casal',
              actualWidth: Number(item.details.actualWidth) || 0,
              actualLength: Number(item.details.actualLength) || 0,
              actualHeight: Number(item.details.actualHeight) || 0,
              
              optStructureReinforce: item.details.optStructureReinforce || false,
              optHardwareReplacement: item.details.optHardwareReplacement || false,

              topFabricSupplyItemId: item.details.topFabricId || null,
              sideFabricSupplyItemId: item.details.sideFabricId || null,
              
              feetSupplyItemId: item.details.feetSupplyItemId || null,
              tapeSupplyItemId: item.details.tapeSupplyItemId || null,

              technicalNotes: item.details.technicalNotes || null
            }
          })

          await generateMaterialRequirementsForReform(tx, saleItem.id, {
            serviceType: 'producao',
            actualWidth: Number(item.details.actualWidth) || 0,
            actualLength: Number(item.details.actualLength) || 0,
            actualHeight: Number(item.details.actualHeight) || 0,
            topFabricSupplyItemId: item.details.topFabricId || null,
            sideFabricSupplyItemId: item.details.sideFabricId || null,
            
            tapeSupplyItemId: item.details.tapeSupplyItemId || null,
            feetSupplyItemId: item.details.feetSupplyItemId || null
          })
        } else if (item.type === 'Limpeza Estofados' || item.type === 'Limpeza de estofados' || item.type === 'Higienização de estofados' || item.type === 'Impermeabilização de estofados' || item.type === 'Impermeabilização' || item.type === 'Higienização') {
          const uCleaning = await tx.saleItemDetailUpholsteryCleaning.create({
            data: {
              saleItemId: saleItem.id,
              technicalNotes: item.details.technicalNotes || null
            }
          })
          
          if (item.details.rows && Array.isArray(item.details.rows)) {
            for (const row of item.details.rows) {
              await tx.saleItemDetailUpholsteryCleaningRow.create({
                data: {
                  saleItemDetailUpholsteryCleaningId: uCleaning.id,
                  objectType: row.objectType,
                  quantity: row.quantity,
                  unitPrice: row.unitPrice,
                  subtotal: row.subtotal,
                  observation: row.observation || null
                }
              })
            }
          }
        }
      }

      // 3. Create Installments (Parcelamento Multiplo) Múltiplos pagamentos
      for (const p of payments) {
        const instCount = Number(p.installments) || 1
        const instAmount = p.amount / instCount
        for (let i = 1; i <= instCount; i++) {
          const dueDate = new Date()
          if (p.isBoleto) {
             // 30, 60, 90, 120
             dueDate.setDate(dueDate.getDate() + (30 * i))
          } else if (i > 1) {
             dueDate.setMonth(dueDate.getMonth() + (i - 1))
          }
          await tx.saleInstallment.create({
            data: {
              saleId: sale.id,
              paymentMethodId: p.methodId,
              installmentNumber: i,
              dueDate,
              amount: instAmount,
              status: "PENDING", // O pagamento só ocorre na entrega conforme regra
              paidAmount: 0,
              paidAt: null
            }
          })
        }
      }

      // 4. Create Order & History
      const order = await tx.order.create({
        data: {
          saleId: sale.id,
          customerId: customerId,
          sellerId: sellerId || null,
          currentStatus: "SOLD",
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          promisedDate: deliveryDate ? new Date(deliveryDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          recipientName: recipientName || null,
          recipientPhone: recipientPhone || null
        }
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: "SOLD",
          notes: "Pedido gerado via PDV",
          transitionSource: "MANUAL",
          changedById: actor.id
        }
      })


      // 5. Trigger Commission Engine (Stage: CONFIRMED)
      if (sellerId) {
        await calculateCommissions({ saleId: sale.id, trigger: "CONFIRMED" })
      }

      // Caixa agora não é atualizado pois o pagamento é na entrega.
      return { success: true, saleId: sale.id, orderId: order.id }
    })

    revalidatePath("/dashboard")
    return { success: true, result }
  } catch (error: any) {
    console.error("PDV Error:", error)
    return { success: false, error: error.message || "Erro interno ao concluir a venda." }
  }
}
