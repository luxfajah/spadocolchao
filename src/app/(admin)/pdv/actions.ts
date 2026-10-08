"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomUUID } from "node:crypto"
import { generateMaterialRequirementsForReform } from "@/lib/services/technical-sheet"
import { generateSaleNumber, generateSlipNumber } from "@/lib/sale-number"
import { calculateCommissions } from "@/lib/commission-engine"
import { getPdvSellerOptions } from "@/lib/pdv-sellers"
import { getAuthenticatedUser } from "@/lib/auth"
import { assertAreaAccess } from "@/lib/access-control"
import { detectMattressDimensions, calculateExtraFoamVolume } from "@/lib/pricing/foam-pricing"

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
    prisma.productService.findMany({ 
      where: { isActive: true },
      select: { 
        id: true, 
        name: true, 
        type: true, 
        operationalCategory: true, 
        defaultPrice: true, 
        minimumPrice: true,
        defaultCost: true,
        productionTimeMinutes: true,
        estimatedLaborCost: true,
        allowPriceChangeInPDV: true,
        requirePriceChangeJustification: true,
        description: true 
      },
      orderBy: [
        { highlightInPDV: "desc" },
        { catalogOrder: "asc" },
        { name: "asc" }
      ]
    }),
    prisma.supplyItem.findMany({ 
      where: { isActive: true },
      select: { 
        id: true, 
        name: true, 
        code: true, 
        currentStock: true, 
        averageCost: true, 
        unit: true, 
        category: { select: { name: true } } 
      },
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

  // Buscar o seller vinculado ao usuário logado (por employeeId ou email)
  const currentSeller = await prisma.seller.findFirst({
    where: {
      isActive: true,
      OR: [
        ...(actor.employeeId ? [{ employeeId: actor.employeeId }] : []),
        ...(actor.email ? [{ email: actor.email }] : []),
      ],
    },
    select: { id: true }
  })

  return { customers, sellers, leadSources, paymentMethods, products, session, supplyItems, currentSellerId: currentSeller?.id ?? null }
}

// 2. Finalization process
export async function finalizeSale(payload: any) {
  try {
    const actor = await requirePdvActor()
    const { 
      customerId, sellerId, leadSourceId, sessionId,
      items, subtotal, globalDiscount, total, 
      payments, notes,
      deliveryDate, pickupDate, recipientName, recipientPhone, logisticsNotes,
      leadSourceDetail, campaignName, referralName, externalSellerName
    } = payload

    if (!customerId) throw new Error("Selecione um cliente.")
    if (!leadSourceId) throw new Error("Selecione uma origem de venda.")
    if (items.length === 0) throw new Error("Adicione itens à venda.")

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base Sale
      const saleNumber = await generateSaleNumber()
      const sale = await tx.sale.create({
        data: {
          number: saleNumber,
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
        const itemCustomizationSummary = item.details?.customizationSummary || null
        const itemTechNotes = item.details?.technicalNotes || null
        const parts = [
          itemCustomizationSummary,
          itemTechNotes ? `Obs: ${itemTechNotes}` : null,
          item.priceJustification ? `Justificativa Negociação: ${item.priceJustification}` : null
        ].filter(Boolean)
        const fullItemNotes = parts.length > 0 ? parts.join(" | ") : null

        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productServiceId: item.productServiceId,
            description: item.name,
            quantity: item.quantity,
            originalPrice: item.originalPrice,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
            notes: fullItemNotes
          }
        })

        // Hook up detailed tables using type category
        const isReformaColchao = 
          item.type === 'Reforma Colchão' || 
          item.type === 'Reforma de colchão' ||
          item.type === 'Reforma Conjunto' ||
          (item.name?.toLowerCase().includes('reforma') && item.name?.toLowerCase().includes('colchão'));

        const isColchaoNovo = 
          item.type === 'Colchão Novo' || 
          item.type === 'Colchão novo' || 
          item.type?.startsWith('Colchão SPA') || 
          item.type === 'Pilow Top' ||
          (!item.name?.toLowerCase().includes('reforma') && (item.name?.toLowerCase().includes('colchão') || item.type?.toLowerCase().includes('colchão')));

        if (isReformaColchao) {
          const mattressDim = detectMattressDimensions(
            item.name || "",
            item.type || "",
            Number(item.details?.actualWidth) || 0,
            Number(item.details?.actualLength) || 0
          );
          await tx.saleItemDetailMattressReform.create({
            data: {
              saleItemId: saleItem.id,
              serviceType: item.details?.serviceType || 'simples',
              commercialSize: item.details?.commercialSize || mattressDim.sizeKey.toLowerCase(),
              actualWidth: Number(item.details?.actualWidth) || mattressDim.width,
              actualLength: Number(item.details?.actualLength) || mattressDim.length,
              actualHeight: Number(item.details?.actualHeight) || 0,
              mattressType: item.details?.mattressType || 'espuma',
              density: item.details?.density || null,
              
              optTotalReplacement: item.details?.optTotalReplacement || false,
              optFoamStructReinforce: item.details?.optFoamStructReinforce || false,
              optRegluing: item.details?.optRegluing || false,
              optSpringSystemRepl: item.details?.optSpringSystemRepl || false,
              optSpringSystemRepair: item.details?.optSpringSystemRepair || false,
              optFullFabricRepl: item.details?.optFullFabricRepl || false,
              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              bottomFabricSupplyItemId: item.details?.bottomFabricId || null,
              topFabricColor: item.details?.topFabricColor || item.details?.topColor || null,
              sideFabricColor: item.details?.sideFabricColor || item.details?.sideColor || null,
              
              foamServiceType: item.details?.foamServiceType || (item.details?.hasExtraFoam ? 'CAMADA_EXTRA' : 'NENHUM'),
              foamSupplyItemId: item.details?.extraFoamSupplyItemId || item.details?.foamSupplyItemId || null,
              addedFoamHeight: item.details?.addedFoamHeight ? Number(item.details.addedFoamHeight) : null,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,
              feetSupplyItemId: item.details?.feetSupplyItemId || null,

              technicalNotes: fullItemNotes
            }
          })

          const hasBOM = await tx.productRecipe.findFirst({
            where: { productServiceId: item.productServiceId, isActive: true }
          })
          if (!hasBOM && (item.details?.actualWidth || item.details?.actualLength)) {
            await generateMaterialRequirementsForReform(tx, saleItem.id, {
              serviceType: item.details?.serviceType || 'simples',
              actualWidth: Number(item.details?.actualWidth) || mattressDim.width,
              actualLength: Number(item.details?.actualLength) || mattressDim.length,
              actualHeight: Number(item.details?.actualHeight) || 0,
              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              bottomFabricSupplyItemId: item.details?.bottomFabricId || null,
              optWaterproofing: item.details?.optWaterproofing || false,
              foamServiceType: item.details?.foamServiceType || (item.details?.hasExtraFoam ? 'CAMADA_EXTRA' : 'NENHUM'),
              foamSupplyItemId: item.details?.extraFoamSupplyItemId || item.details?.foamSupplyItemId || null,
              addedFoamHeight: item.details?.addedFoamHeight ? Number(item.details.addedFoamHeight) : null,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,
              feetSupplyItemId: item.details?.feetSupplyItemId || null
            })
          }

        } else if (item.type === 'Reforma Box' || item.type === 'Reforma de box') {
          await tx.saleItemDetailBoxReform.create({
            data: {
              saleItemId: saleItem.id,
              serviceType: item.details?.serviceType || 'simples',
              boxType: item.details?.boxType || 'comum',
              commercialSize: item.details?.commercialSize || 'casal',
              actualWidth: Number(item.details?.actualWidth) || 0,
              actualLength: Number(item.details?.actualLength) || 0,
              actualHeight: Number(item.details?.actualHeight) || 0,
              optStructureReinforce: item.details?.optStructureReinforce || false,
              optHardwareReplacement: item.details?.optHardwareReplacement || false,
              optFullFabricRepl: item.details?.optFullFabricRepl || false,
              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              topFabricColor: item.details?.topFabricColor || item.details?.topColor || null,
              sideFabricColor: item.details?.sideFabricColor || item.details?.sideColor || null,
              
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,
              feetSupplyItemId: item.details?.feetSupplyItemId || null,

              technicalNotes: fullItemNotes
            }
          })

          const hasBOM = await tx.productRecipe.findFirst({
            where: { productServiceId: item.productServiceId, isActive: true }
          })
          if (!hasBOM && (item.details?.actualWidth || item.details?.actualLength)) {
            await generateMaterialRequirementsForReform(tx, saleItem.id, {
              serviceType: item.details?.serviceType || 'simples',
              actualWidth: Number(item.details?.actualWidth) || 0,
              actualLength: Number(item.details?.actualLength) || 0,
              actualHeight: Number(item.details?.actualHeight) || 0,
              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              optWaterproofing: item.details?.optWaterproofing || false,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,
              feetSupplyItemId: item.details?.feetSupplyItemId || null
            })
          }

        } else if (isColchaoNovo) {
          const mattressDim = detectMattressDimensions(
            item.name || "",
            item.type || "",
            Number(item.details?.actualWidth) || 0,
            Number(item.details?.actualLength) || 0
          );
          await tx.saleItemDetailNewMattress.create({
            data: {
              saleItemId: saleItem.id,
              commercialSize: item.details?.commercialSize || mattressDim.sizeKey.toLowerCase(),
              actualWidth: Number(item.details?.actualWidth) || mattressDim.width,
              actualLength: Number(item.details?.actualLength) || mattressDim.length,
              actualHeight: Number(item.details?.actualHeight) || 0,
              mattressType: item.details?.mattressType || 'espuma',
              density: item.details?.density || null,
              
              topFabricSupplyItemId: item.details?.topFabricId || null,
              bottomFabricSupplyItemId: item.details?.bottomFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              
              foamSupplyItemId: item.details?.extraFoamSupplyItemId || item.details?.foamSupplyItemId || null,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,
              feetSupplyItemId: item.details?.feetSupplyItemId || null,

              technicalNotes: fullItemNotes
            }
          })

          const hasBOM = await tx.productRecipe.findFirst({
            where: { productServiceId: item.productServiceId, isActive: true }
          })
          if (!hasBOM && (item.details?.actualWidth || item.details?.actualLength)) {
            await generateMaterialRequirementsForReform(tx, saleItem.id, {
              serviceType: 'producao',
              actualWidth: Number(item.details?.actualWidth) || 0,
              actualLength: Number(item.details?.actualLength) || 0,
              actualHeight: Number(item.details?.actualHeight) || 0,
              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              bottomFabricSupplyItemId: item.details?.bottomFabricId || null,
              foamServiceType: item.details?.foamSupplyItemId ? 'TROCA_TOTAL' : 'NENHUM',
              foamSupplyItemId: item.details?.foamSupplyItemId || null,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null
            })
          }
        } else if (item.type === 'Box Novo' || item.type === 'Box novo') {
           await tx.saleItemDetailNewBox.create({
            data: {
              saleItemId: saleItem.id,
              boxType: item.details?.boxType || 'comum',
              commercialSize: item.details?.commercialSize || 'casal',
              actualWidth: Number(item.details?.actualWidth) || 0,
              actualLength: Number(item.details?.actualLength) || 0,
              actualHeight: Number(item.details?.actualHeight) || 0,
              
              optStructureReinforce: item.details?.optStructureReinforce || false,
              optHardwareReplacement: item.details?.optHardwareReplacement || false,

              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              
              feetSupplyItemId: item.details?.feetSupplyItemId || null,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,

              technicalNotes: fullItemNotes
            }
          })

          const hasBOM = await tx.productRecipe.findFirst({
            where: { productServiceId: item.productServiceId, isActive: true }
          })
          if (!hasBOM && (item.details?.actualWidth || item.details?.actualLength)) {
            await generateMaterialRequirementsForReform(tx, saleItem.id, {
              serviceType: 'producao',
              actualWidth: Number(item.details?.actualWidth) || 0,
              actualLength: Number(item.details?.actualLength) || 0,
              actualHeight: Number(item.details?.actualHeight) || 0,
              topFabricSupplyItemId: item.details?.topFabricId || null,
              sideFabricSupplyItemId: item.details?.sideFabricId || null,
              tapeSupplyItemId: item.details?.tapeSupplyItemId || null,
              feetSupplyItemId: item.details?.feetSupplyItemId || null
            })
          }
        } else if (item.type === 'Limpeza Estofados' || item.type === 'Limpeza de estofados' || item.type === 'Higienização de estofados' || item.type === 'Impermeabilização de estofados' || item.type === 'Impermeabilização' || item.type === 'Higienização') {
          const uCleaning = await tx.saleItemDetailUpholsteryCleaning.create({
            data: {
              saleItemId: saleItem.id,
              technicalNotes: fullItemNotes
            }
          })
          
          if (item.details?.rows && Array.isArray(item.details.rows)) {
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

        // 2.5 Processamento de Ficha Técnica (BOM) e Baixa Automática de Estoque
        const existingReqsCount = await tx.saleItemMaterialRequirement.count({
          where: { saleItemId: saleItem.id }
        })

        if (existingReqsCount === 0 && item.productServiceId) {
          // Gerar requisitos a partir da Ficha Técnica do Produto
          const productWithRecipe = await tx.productService.findUnique({
            where: { id: item.productServiceId },
            include: {
              recipes: {
                where: { isActive: true },
                include: {
                  items: {
                    include: { supplyItem: true },
                    orderBy: { displayOrder: "asc" }
                  }
                }
              }
            }
          })

          const recipe = productWithRecipe?.recipes.find((r) => r.isDefault) || productWithRecipe?.recipes[0]

          if (recipe && recipe.items.length > 0) {
            const itemQty = Number(item.quantity) || 1
            for (const rItem of recipe.items) {
              const isFeetItem = rItem.supplyItem.code?.startsWith("INS-PE") || rItem.supplyItem.name?.toLowerCase().includes("pé")
              
              // Se o cliente escolheu "Sem Pés", pula o insumo de pé da baixa
              if (isFeetItem && item.details?.hasFeet === false) {
                continue
              }

              // Se o cliente escolheu um modelo de pé específico cadastrado
              let effectiveSupplyItemId = rItem.supplyItemId
              let effectiveSupplyItem = rItem.supplyItem
              if (isFeetItem && item.details?.feetSupplyItemId) {
                const customFeetSupply = await tx.supplyItem.findUnique({
                  where: { id: item.details.feetSupplyItemId }
                })
                if (customFeetSupply) {
                  effectiveSupplyItemId = customFeetSupply.id
                  effectiveSupplyItem = customFeetSupply
                }
              }

              // Se o cliente escolheu um modelo de fitilho específico cadastrado (ex: Colméia Especial)
              const isFitilhoItem = rItem.supplyItem.code?.startsWith("INS-FIT") || rItem.supplyItem.name?.toLowerCase().includes("fitim") || rItem.supplyItem.name?.toLowerCase().includes("fitilho")
              if (isFitilhoItem && item.details?.fitilhoSupplyItemId) {
                const customFitilhoSupply = await tx.supplyItem.findUnique({
                  where: { id: item.details.fitilhoSupplyItemId }
                })
                if (customFitilhoSupply) {
                  effectiveSupplyItemId = customFitilhoSupply.id
                  effectiveSupplyItem = customFitilhoSupply
                }
              }

              const qtyNeeded = Number(rItem.baseQuantity) * itemQty

              await tx.saleItemMaterialRequirement.create({
                data: {
                  saleItemId: saleItem.id,
                  sourceRecipeId: recipe.id,
                  sourceRecipeItemId: rItem.id,
                  supplyItemId: effectiveSupplyItemId,
                  part: rItem.componentPart || "Produção",
                  quantityCalculated: qtyNeeded,
                  unit: rItem.unit || effectiveSupplyItem.unit,
                  unitCostSnapshot: effectiveSupplyItem.averageCost || 0,
                  totalCostSnapshot: (effectiveSupplyItem.averageCost || 0) * qtyNeeded,
                  notes: rItem.notes || `Ficha técnica: ${recipe.name}`
                }
              })

              if (productWithRecipe?.consumesStock || recipe.consumesStock) {
                await tx.supplyItem.update({
                  where: { id: effectiveSupplyItemId },
                  data: {
                    currentStock: { decrement: qtyNeeded }
                  }
                })

                await tx.stockMovement.create({
                  data: {
                    supplyItemId: effectiveSupplyItemId,
                    movementType: "EXIT",
                    quantity: qtyNeeded,
                    unitCost: effectiveSupplyItem.averageCost || 0,
                    totalCost: (effectiveSupplyItem.averageCost || 0) * qtyNeeded,
                    referenceType: "SALE",
                    referenceId: sale.id,
                    notes: `Baixa por venda #${sale.number} - Produto: ${item.name} (${rItem.componentPart || 'Insumo'})`
                  }
                })
              }
            }

            // Se o colchão teve Camada Extra de Espuma selecionada
            if (item.details?.hasExtraFoam) {
              let extraFoamSupply = item.details?.extraFoamSupplyItemId
                ? await tx.supplyItem.findUnique({
                    where: { id: item.details.extraFoamSupplyItemId }
                  })
                : null

              if (!extraFoamSupply) {
                const isR26 = item.details?.extraFoamOption?.includes("R-26") || item.details?.extraFoamOption?.includes("R26")
                const targetCode = isR26 ? "INS-ESP-R26-5CM" : "INS-ESP-D28"
                extraFoamSupply = await tx.supplyItem.findFirst({
                  where: {
                    OR: [
                      { code: targetCode },
                      { name: isR26 ? "Espuma Aglomerada R-26 (5 cm)" : "Espuma Poliuretano D-28 Bloco" }
                    ]
                  }
                })
              }

              if (extraFoamSupply) {
                const addedHeightCm = Number(item.details.addedFoamHeight) || 5
                const mattressDim = detectMattressDimensions(
                  item.name || "",
                  item.type || "",
                  Number(item.details?.actualWidth) || 0,
                  Number(item.details?.actualLength) || 0
                )
                const foamVolumeM3 = calculateExtraFoamVolume(
                  mattressDim.width,
                  mattressDim.length,
                  addedHeightCm,
                  itemQty
                )
                const foamQty = extraFoamSupply.unit === 'M3' ? foamVolumeM3 : itemQty
                const foamDirectCost = (extraFoamSupply.averageCost || 0) * foamQty

                await tx.saleItemMaterialRequirement.create({
                  data: {
                    saleItemId: saleItem.id,
                    sourceRecipeId: recipe.id,
                    supplyItemId: extraFoamSupply.id,
                    part: "Camada Extra de Conforto",
                    quantityCalculated: foamQty,
                    unit: extraFoamSupply.unit,
                    unitCostSnapshot: extraFoamSupply.averageCost || 0,
                    totalCostSnapshot: foamDirectCost,
                    notes: `Pillow / Camada Extra: ${item.details.extraFoamOption || extraFoamSupply.name} (${mattressDim.label})`
                  }
                })

                if (productWithRecipe?.consumesStock || recipe.consumesStock) {
                  await tx.supplyItem.update({
                    where: { id: extraFoamSupply.id },
                    data: { currentStock: { decrement: foamQty } }
                  })

                  await tx.stockMovement.create({
                    data: {
                      supplyItemId: extraFoamSupply.id,
                      movementType: "EXIT",
                      quantity: foamQty,
                      unitCost: extraFoamSupply.averageCost || 0,
                      totalCost: (extraFoamSupply.averageCost || 0) * foamQty,
                      referenceType: "SALE",
                      referenceId: sale.id,
                      notes: `Baixa por venda #${sale.number} - Camada Extra: ${item.name} (${extraFoamSupply.name})`
                    }
                  })
                }
              }
            }
          }
        } else if (existingReqsCount > 0) {
          // Baixar do estoque os requisitos gerados dinamicamente pelos formulários de reforma
          const dynamicReqs = await tx.saleItemMaterialRequirement.findMany({
            where: { saleItemId: saleItem.id },
            include: { supplyItem: true }
          })
          for (const dReq of dynamicReqs) {
            await tx.supplyItem.update({
              where: { id: dReq.supplyItemId },
              data: { currentStock: { decrement: dReq.quantityCalculated } }
            })
            await tx.stockMovement.create({
              data: {
                supplyItemId: dReq.supplyItemId,
                movementType: "EXIT",
                quantity: dReq.quantityCalculated,
                unitCost: dReq.unitCostSnapshot || 0,
                totalCost: dReq.totalCostSnapshot || 0,
                referenceType: "SALE",
                referenceId: sale.id,
                notes: `Baixa por venda #${sale.number} - Reforma: ${dReq.part}`
              }
            })
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
      const combinedOrderNotes = [
        notes,
        logisticsNotes ? `Logística: ${logisticsNotes}` : null,
        pickupDate ? `Retirada agendada: ${new Date(pickupDate).toLocaleString('pt-BR')}` : null,
      ].filter(Boolean).join(" | ") || null

      const order = await tx.order.create({
        data: {
          saleId: sale.id,
          customerId: customerId,
          sellerId: sellerId || null,
          currentStatus: "SOLD",
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          promisedDate: deliveryDate ? new Date(deliveryDate) : (pickupDate ? new Date(pickupDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
          recipientName: recipientName || null,
          recipientPhone: recipientPhone || null,
          notes: combinedOrderNotes
        }
      })

      if (deliveryDate) {
        await tx.orderDelivery.create({
          data: {
            orderId: order.id,
            status: "PENDING",
            scheduledDate: new Date(deliveryDate),
            recipientName: recipientName || null,
            recipientPhone: recipientPhone || null,
            notes: logisticsNotes || null
          }
        })
      }

      if (pickupDate || deliveryDate || logisticsNotes) {
        const scheduleLog = [
          pickupDate ? `Retirada agendada: ${new Date(pickupDate).toLocaleDateString('pt-BR')} ${new Date(pickupDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : null,
          deliveryDate ? `Entrega agendada: ${new Date(deliveryDate).toLocaleDateString('pt-BR')} ${new Date(deliveryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : null,
          recipientName ? `Recebedor: ${recipientName}` : null,
          logisticsNotes ? `Obs: ${logisticsNotes}` : null
        ].filter(Boolean).join(" • ");

        await tx.orderNote.create({
          data: {
            orderId: order.id,
            type: "DELIVERY",
            content: scheduleLog,
            createdById: actor.id
          }
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: "SOLD",
          notes: "Pedido gerado via PDV",
          transitionSource: "MANUAL",
          changedById: actor.id
        }
      })

      // 4.5 Generate Production Slip (Ficha de Produção)
      const slipNumber = await generateSlipNumber()
      const productionSlip = await tx.orderProductionSlip.create({
        data: {
          orderId: order.id,
          number: slipNumber,
          status: "ISSUED",
          createdById: actor.id,
          notes: "Gerado automaticamente na finalização do PDV"
        }
      })

      // Link all items to the slip
      // Note: We need the actual sale item IDs created earlier.
      // I should have collected them.
      // Wait, I created them in a loop. I should query them back or collect them.
      const saleItemsCreated = await tx.saleItem.findMany({
        where: { saleId: sale.id }
      })

      for (const item of saleItemsCreated) {
        await tx.orderProductionSlipLine.create({
          data: {
            productionSlipId: productionSlip.id,
            saleItemId: item.id,
            quantity: item.quantity,
            notes: item.description
          }
        })
      }


      // 5. Trigger Commission Engine (Stage: CONFIRMED)
      if (sellerId) {
        await calculateCommissions({ saleId: sale.id, trigger: "CONFIRMED" })
      }

      // Caixa agora não é atualizado pois o pagamento é na entrega.
      return { success: true, saleId: sale.id, orderId: order.id }
    }, { maxWait: 15000, timeout: 30000 })

    revalidatePath("/dashboard")
    return { success: true, result }
  } catch (error: any) {
    console.error("PDV Error:", error)
    return { success: false, error: error.message || "Erro interno ao concluir a venda." }
  }
}
