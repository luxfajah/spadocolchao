import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateSaleNumber, generateSlipNumber } from "@/lib/sale-number"

export const dynamic = "force-dynamic"

// GET: Lista os pedidos vinculados ao vendedor (ou todos os ativos se for gestor/não vinculado)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sellerId = searchParams.get("sellerId")

    const whereClause: any = {}
    if (sellerId && sellerId !== "__NONE__" && sellerId !== "null") {
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
            addressCity: true,
            addressNeighborhood: true,
            addressStreet: true,
            addressNumber: true,
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
      customerAddress: [
        o.customer?.addressStreet,
        o.customer?.addressNumber,
        o.customer?.addressNeighborhood,
        o.customer?.addressCity,
      ]
        .filter(Boolean)
        .join(", "),
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
      total,
      paymentMethodId,
      notes,
      deliveryDate,
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

    const result = await prisma.$transaction(async (tx) => {
      const saleNumber = await generateSaleNumber()

      const sale = await tx.sale.create({
        data: {
          number: saleNumber,
          customerId,
          sellerId: sellerId || null,
          leadSourceId: leadSource?.id || null,
          subtotalAmount: Number(subtotal || total),
          discountAmount: Number(discount || 0),
          totalAmount: Number(total),
          status: "CONFIRMED",
          financialStatus: "PENDING",
          notes: notes || "Venda emitida via App iOS Vendedor",
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

      // Cria o Pedido (Order)
      const order = await tx.order.create({
        data: {
          saleId: sale.id,
          customerId,
          sellerId: sellerId || null,
          currentStatus: "SOLD",
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          promisedDate: deliveryDate
            ? new Date(deliveryDate)
            : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
      })

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
