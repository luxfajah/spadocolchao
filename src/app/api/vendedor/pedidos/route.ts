import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSaleNumber, generateSlipNumber } from "@/lib/sale-number"

export const dynamic = "force-dynamic"

// GET: Lista os pedidos vinculados ao vendedor (ou todos os ativos se for gestor/não vinculado)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sellerId = searchParams.get("sellerId")
    const isAdmin = searchParams.get("isAdmin") === "true"
    const all = searchParams.get("all") === "true"
    const testMode = searchParams.get("testMode") === "true"

    const whereClause: any = {}
    if (sellerId && sellerId !== "__NONE__" && sellerId !== "null" && !isAdmin && !all) {
      whereClause.sellerId = sellerId
    }

    if (testMode) {
      whereClause.OR = [
        { currentStatus: "TEST" },
        { sale: { status: "TEST" } },
        { sale: { number: { startsWith: "TEST-" } } },
      ]
    } else {
      whereClause.AND = [
        { currentStatus: { not: "TEST" } },
        { sale: { status: { not: "TEST" } } },
        { sale: { number: { not: { startsWith: "TEST-" } } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            whatsapp: true,
            addresses: {
              take: 1,
              select: {
                street: true,
                number: true,
                neighborhood: true,
                city: true,
              },
            },
          },
        },
        sale: {
          select: {
            id: true,
            number: true,
            totalAmount: true,
            saleDate: true,
            items: {
              select: {
                id: true,
                description: true,
                quantity: true,
                unitPrice: true,
                totalAmount: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    })

    const formattedOrders = orders.map((o) => ({
      id: o.id,
      saleNumber: o.sale?.number || `PED-${o.id.slice(0, 6)}`,
      customerName: o.customer?.fullName || "Cliente Não Identificado",
      customerPhone: o.customer?.phone || o.customer?.whatsapp || "",
      customerAddress: (() => {
        const addr = o.customer?.addresses?.[0]
        if (!addr) return ""
        return [addr.street, addr.number, addr.neighborhood, addr.city]
          .filter(Boolean)
          .join(", ")
      })(),
      status: o.currentStatus, // SOLD, WAITING_PREPARATION, IN_PRODUCTION, WAITING_DELIVERY, DELIVERED, FINALIZED
      totalAmount: o.sale?.totalAmount || 0,
      createdAt: o.createdAt.toISOString(),
      deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString() : null,
      items:
        o.sale?.items.map((i) => ({
          id: i.id,
          name: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.totalAmount,
        })) || [],
    }))

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    })
  } catch (error: any) {
    console.error("Erro ao listar pedidos do vendedor:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao listar pedidos" },
      { status: 500 }
    )
  }
}

// POST: Criação de pedido/venda direto pelo app iOS Vendedor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customerId,
      sellerId,
      items,
      subtotal,
      discount,
      freight,
      total,
      paymentMethodId,
      paymentMethodName,
      installments,
      hasDownPayment,
      isDownPaymentPaid,
      downPaymentAmount,
      downPaymentMethod,
      scheduleMode,
      pickupDate,
      pickupTime,
      deliveryDate,
      deliveryTime,
      recipientName,
      recipientPhone,
      logisticsNotes,
      notes,
      isTest,
    } = body

    const isTestMode = Boolean(isTest)

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Cliente é obrigatório" },
        { status: 400 }
      )
    }

    if (!items || !items.length) {
      return NextResponse.json(
        { success: false, error: "Carrinho vazio" },
        { status: 400 }
      )
    }

    // Busca leadSource padrão para PDV
    let leadSource = await prisma.leadSource.findFirst({
      where: { isDefaultPdv: true, isActive: true },
    })
    if (!leadSource) {
      leadSource = await prisma.leadSource.findFirst({ where: { isActive: true } })
    }
    if (!leadSource) {
      leadSource = await prisma.leadSource.findFirst()
    }
    if (!leadSource) {
      return NextResponse.json(
        { success: false, error: "Nenhuma origem de venda encontrada no sistema" },
        { status: 400 }
      )
    }
    const activeLeadSourceId: string = leadSource.id

    const finalFreight = Number(freight || 0)
    const effectiveDownPaymentAmount = hasDownPayment ? Number(downPaymentAmount || 0) : 0
    const finalTotal = Number(total)
    const isEntryPaid = isDownPaymentPaid !== false
    const initialPaid = hasDownPayment && isEntryPaid ? effectiveDownPaymentAmount : 0
    const isFullyPaid = initialPaid >= finalTotal - 0.05
    const isPartiallyPaid = initialPaid > 0 && !isFullyPaid
    const financialStatus = isTestMode
      ? "TEST"
      : isFullyPaid
      ? "PAID"
      : isPartiallyPaid
      ? "PARTIALLY_PAID"
      : "PENDING"

    const parsedDelivery = deliveryDate
      ? new Date(deliveryDate.includes("T") ? deliveryDate : `${deliveryDate}T${deliveryTime || "00:00"}:00`)
      : null
    const parsedPickup = pickupDate
      ? new Date(pickupDate.includes("T") ? pickupDate : `${pickupDate}T${pickupTime || "00:00"}:00`)
      : null

    const downPaymentNote = hasDownPayment && effectiveDownPaymentAmount > 0
      ? `Entrada no ato: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(effectiveDownPaymentAmount)} (${downPaymentMethod || paymentMethodName || "PIX"}) | Saldo na entrega: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.max(0, finalTotal - effectiveDownPaymentAmount))}`
      : null
    const freightNote = finalFreight > 0
      ? `Frete: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(finalFreight)}`
      : null
    const scheduleNotes = [
      parsedPickup ? `Retirada agendada: ${parsedPickup.toLocaleDateString("pt-BR")} (${pickupTime || "Comercial"})` : null,
      parsedDelivery ? `Entrega agendada: ${parsedDelivery.toLocaleDateString("pt-BR")} (${deliveryTime || "Comercial"})` : null,
      logisticsNotes ? `Logística: ${logisticsNotes}` : null,
    ].filter(Boolean).join(" | ")

    const combinedSaleNotes = [
      isTestMode ? "[AMBIENTE DE TESTES / SANDBOX - NÃO PRODUZIR]" : null,
      notes || (isTestMode ? "Venda de Teste via App iOS" : "Venda emitida via App iOS Vendedor"),
      freightNote,
      downPaymentNote,
      scheduleNotes,
    ].filter(Boolean).join(" | ")

    const result = await prisma.$transaction(async (tx) => {
      let saleNumber: string
      if (isTestMode) {
        const testCount = await tx.sale.count({
          where: { number: { startsWith: "TEST-" } },
        })
        const now = new Date()
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
        saleNumber = `TEST-${yyyymm}-${String(testCount + 1).padStart(5, "0")}`
      } else {
        saleNumber = await generateSaleNumber()
      }

      const sale = await tx.sale.create({
        data: {
          number: saleNumber,
          customerId,
          sellerId: sellerId || null,
          leadSourceId: activeLeadSourceId,
          subtotalAmount: Number(subtotal || finalTotal),
          discountAmount: Number(discount || 0),
          surchargeAmount: finalFreight,
          totalAmount: finalTotal,
          paidAmount: initialPaid,
          status: isTestMode ? "TEST" : "CONFIRMED",
          financialStatus,
          notes: combinedSaleNotes,
        },
      })

      // Cria os itens
      for (const item of items) {
        let itemDescription = item.name
        if (item.customization) {
          const parts = [
            item.customization.extraFoam && !item.customization.extraFoam.includes("Sem Camada") ? item.customization.extraFoam : null,
            item.customization.topFabric ? `Tampo: ${item.customization.topFabric}` : null,
            item.customization.color ? `Tecido: ${item.customization.color}` : null,
            item.customization.fitilho && item.customization.fitilho !== "Fitilho Tom sobre Tom" ? item.customization.fitilho : null,
            item.customization.feet ? `Pés: ${item.customization.feet}` : null,
            item.customization.observations ? `Obs: ${item.customization.observations}` : null,
          ].filter(Boolean)
          if (parts.length > 0) {
            itemDescription = `${item.name} (${parts.join(" • ")})`
          }
        }

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productServiceId: item.productId,
            description: itemDescription,
            quantity: Number(item.quantity || 1),
            originalPrice: Number(item.price),
            unitPrice: Number(item.price),
            discountAmount: 0,
            totalAmount: Number(item.price) * Number(item.quantity || 1),
          },
        })
      }

      // Busca ou seleciona método de pagamento
      let method = null
      if (paymentMethodId) {
        method = await tx.paymentMethod.findUnique({ where: { id: paymentMethodId } })
      }
      if (!method && paymentMethodName) {
        method = await tx.paymentMethod.findFirst({
          where: { name: { contains: paymentMethodName, mode: "insensitive" } },
        })
      }
      if (!method) {
        method = await tx.paymentMethod.findFirst()
      }

      if (hasDownPayment && effectiveDownPaymentAmount > 0) {
        // Parcela 1: Entrada paga hoje (ou pendente se não paga)
        let downMethod = method
        if (downPaymentMethod) {
          const found = await tx.paymentMethod.findFirst({
            where: { name: { contains: downPaymentMethod, mode: "insensitive" } },
          })
          if (found) downMethod = found
        }

        await tx.saleInstallment.create({
          data: {
            saleId: sale.id,
            paymentMethodId: downMethod?.id || method?.id || "",
            installmentNumber: 1,
            dueDate: new Date(),
            amount: effectiveDownPaymentAmount,
            status: isEntryPaid ? "PAID" : "PENDING",
            paidAmount: isEntryPaid ? effectiveDownPaymentAmount : 0,
            paidAt: isEntryPaid ? new Date() : null,
          },
        })

        // Parcela 2+: Saldo a receber na entrega
        const remainingBalance = Math.max(0, finalTotal - effectiveDownPaymentAmount)
        if (remainingBalance > 0.05) {
          const numInst = Number(installments) > 1 ? Number(installments) : 1
          const instAmount = Number((remainingBalance / numInst).toFixed(2))
          const baseDueDate = parsedDelivery || (parsedPickup ?? new Date(Date.now() + 7 * 86400 * 1000))

          for (let i = 1; i <= numInst; i++) {
            const instDueDate = new Date(baseDueDate)
            if (i > 1) {
              instDueDate.setMonth(instDueDate.getMonth() + (i - 1))
            }
            const isLast = i === numInst
            const finalInstAmount = isLast
              ? Number((remainingBalance - instAmount * (numInst - 1)).toFixed(2))
              : instAmount

            await tx.saleInstallment.create({
              data: {
                saleId: sale.id,
                paymentMethodId: method?.id || "",
                installmentNumber: 1 + i,
                dueDate: instDueDate,
                amount: finalInstAmount,
                status: "PENDING",
                paidAmount: 0,
                paidAt: null,
              },
            })
          }
        }
      } else {
        // Sem entrada: parcelamento iniciando na entrega
        const numInst = Number(installments) > 1 ? Number(installments) : 1
        const instAmount = Number((finalTotal / numInst).toFixed(2))
        const baseDueDate = parsedDelivery || (parsedPickup ?? new Date(Date.now() + 7 * 86400 * 1000))

        for (let i = 1; i <= numInst; i++) {
          const instDueDate = new Date(baseDueDate)
          if (i > 1) {
            instDueDate.setMonth(instDueDate.getMonth() + (i - 1))
          }
          const isLast = i === numInst
          const finalInstAmount = isLast
            ? Number((finalTotal - instAmount * (numInst - 1)).toFixed(2))
            : instAmount

          await tx.saleInstallment.create({
            data: {
              saleId: sale.id,
              paymentMethodId: method?.id || "",
              installmentNumber: i,
              dueDate: instDueDate,
              amount: finalInstAmount,
              status: "PENDING",
              paidAmount: 0,
              paidAt: null,
            },
          })
        }
      }

      // Cria o Pedido (Order)
      const order = await tx.order.create({
        data: {
          saleId: sale.id,
          customerId,
          sellerId: sellerId || null,
          currentStatus: "SOLD",
          pickupDate: parsedPickup,
          deliveryDate: parsedDelivery,
          promisedDate: parsedDelivery
            ? parsedDelivery
            : (parsedPickup ? parsedPickup : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)),
          recipientName: recipientName || null,
          recipientPhone: recipientPhone || null,
          notes: combinedSaleNotes,
        },
      })

      if (parsedDelivery) {
        await tx.orderDelivery.create({
          data: {
            orderId: order.id,
            status: "PENDING",
            scheduledDate: parsedDelivery,
            recipientName: recipientName || null,
            recipientPhone: recipientPhone || null,
            notes: logisticsNotes || null,
          },
        })
      }

      if (parsedPickup || parsedDelivery || logisticsNotes) {
        await tx.orderNote.create({
          data: {
            orderId: order.id,
            type: "DELIVERY",
            content: scheduleNotes || "Agendamento registrado via App iOS",
          },
        })
      }

      // Registra Histórico
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: "SOLD",
          notes: "Pedido gerado via App iOS Vendedor",
          transitionSource: "MANUAL",
        },
      })

      // Gera Ficha de Produção
      const slipNumber = await generateSlipNumber()
      await tx.orderProductionSlip.create({
        data: {
          orderId: order.id,
          number: slipNumber,
          status: "ISSUED",
          notes: "Gerado automaticamente pelo App iOS",
        },
      })

      return { saleNumber, orderId: order.id, saleId: sale.id }
    })

    return NextResponse.json({
      success: true,
      message: "Pedido criado com sucesso!",
      saleNumber: result.saleNumber,
      orderId: result.orderId,
    })
  } catch (error: any) {
    console.error("Erro ao finalizar pedido via App iOS:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao processar venda" },
      { status: 500 }
    )
  }
}

// DELETE: Exclusão de vendas de teste / sandbox sem afetar dados reais
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const testOnly = searchParams.get("testOnly") === "true"
    const saleId = searchParams.get("saleId")

    const whereSale: any = {}
    if (testOnly) {
      whereSale.OR = [
        { status: "TEST" },
        { financialStatus: "TEST" },
        { number: { startsWith: "TEST-" } },
        { notes: { contains: "SANDBOX" } },
        { notes: { contains: "AMBIENTE DE TESTES" } },
      ]
    } else if (saleId) {
      whereSale.id = saleId
    } else {
      return NextResponse.json(
        { success: false, error: "Parâmetro inválido para exclusão" },
        { status: 400 }
      )
    }

    const testSales = await prisma.sale.findMany({
      where: whereSale,
      select: { id: true },
    })
    const saleIds = testSales.map((s) => s.id)

    if (saleIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma venda de teste encontrada para remoção",
        count: 0,
      })
    }

    const orders = await prisma.order.findMany({
      where: { saleId: { in: saleIds } },
      select: { id: true },
    })
    const orderIds = orders.map((o) => o.id)

    const saleItems = await prisma.saleItem.findMany({
      where: { saleId: { in: saleIds } },
      select: { id: true },
    })
    const saleItemIds = saleItems.map((i) => i.id)

    const slips = await prisma.orderProductionSlip.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true },
    })
    const slipIds = slips.map((s) => s.id)

    await prisma.$transaction(async (tx) => {
      if (slipIds.length > 0 || saleItemIds.length > 0) {
        await tx.orderProductionSlipLine.deleteMany({
          where: {
            OR: [
              { productionSlipId: { in: slipIds } },
              { saleItemId: { in: saleItemIds } },
            ],
          },
        })
      }
      if (orderIds.length > 0) {
        await tx.orderProductionSlip.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderDelivery.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderNote.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } })
        await tx.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      await tx.saleInstallment.deleteMany({ where: { saleId: { in: saleIds } } })
      await tx.saleItemDetailMattressReform.deleteMany({ where: { saleItemId: { in: saleItemIds } } })
      await tx.saleItemDetailBoxReform.deleteMany({ where: { saleItemId: { in: saleItemIds } } })
      await tx.saleItem.deleteMany({ where: { saleId: { in: saleIds } } })
      await tx.sale.deleteMany({ where: { id: { in: saleIds } } })
    })

    return NextResponse.json({
      success: true,
      message: `${saleIds.length} venda(s) de teste removida(s) com sucesso!`,
      count: saleIds.length,
    })
  } catch (error: any) {
    console.error("Erro ao deletar vendas de teste:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao deletar vendas de teste" },
      { status: 500 }
    )
  }
}
