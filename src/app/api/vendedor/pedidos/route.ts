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

    const whereClause: any = {}
    if (sellerId && sellerId !== "__NONE__" && sellerId !== "null" && !isAdmin && !all) {
      whereClause.sellerId = sellerId
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
      hasDownPayment,
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
    } = body

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
    const initialPaid = effectiveDownPaymentAmount > 0 ? effectiveDownPaymentAmount : 0
    const isFullyPaid = initialPaid >= finalTotal - 0.05
    const isPartiallyPaid = initialPaid > 0 && !isFullyPaid
    const financialStatus = isFullyPaid ? "PAID" : isPartiallyPaid ? "PARTIALLY_PAID" : "PENDING"

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
      notes || "Venda emitida via App iOS Vendedor",
      freightNote,
      downPaymentNote,
      scheduleNotes,
    ].filter(Boolean).join(" | ")

    const result = await prisma.$transaction(async (tx) => {
      const saleNumber = await generateSaleNumber()

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
          status: "CONFIRMED",
          financialStatus,
          notes: combinedSaleNotes,
        },
      })

      // Cria os itens
      for (const item of items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productServiceId: item.productId,
            description: item.name,
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
        // Parcela 1: Entrada paga hoje
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
            status: "PAID",
            paidAmount: effectiveDownPaymentAmount,
            paidAt: new Date(),
          },
        })

        // Parcela 2: Saldo na entrega
        const remainingBalance = Math.max(0, finalTotal - effectiveDownPaymentAmount)
        if (remainingBalance > 0.05) {
          await tx.saleInstallment.create({
            data: {
              saleId: sale.id,
              paymentMethodId: method?.id || "",
              installmentNumber: 2,
              dueDate: parsedDelivery || (parsedPickup ?? new Date(Date.now() + 7 * 86400 * 1000)),
              amount: remainingBalance,
              status: "PENDING",
              paidAmount: 0,
              paidAt: null,
            },
          })
        }
      } else {
        // Sem entrada: parcela única para a entrega
        await tx.saleInstallment.create({
          data: {
            saleId: sale.id,
            paymentMethodId: method?.id || "",
            installmentNumber: 1,
            dueDate: parsedDelivery || (parsedPickup ?? new Date(Date.now() + 7 * 86400 * 1000)),
            amount: finalTotal,
            status: "PENDING",
            paidAmount: 0,
            paidAt: null,
          },
        })
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
