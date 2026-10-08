import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/app/login/actions";

export const dynamic = "force-dynamic";

// GET: Retorna os pedidos mais recentes do PDV com todos os detalhes de cliente, personalização e logística
export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 40;
    const since = searchParams.get("since"); // ISO date string para buscar apenas novos pedidos
    const orderId = searchParams.get("id") || searchParams.get("orderId");

    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: {
            include: {
              addresses: true,
              contacts: true,
            },
          },
          seller: true,
          sale: {
            include: {
              leadSource: true,
              items: {
                include: {
                  productService: true,
                  detailMattressReform: {
                    include: {
                      topFabric: true,
                      sideFabric: true,
                      bottomFabric: true,
                      foamSupply: true,
                      tapeSupply: true,
                      feetSupply: true,
                    },
                  },
                  detailBoxReform: {
                    include: {
                      topFabric: true,
                      sideFabric: true,
                      tapeSupply: true,
                      feetSupply: true,
                    },
                  },
                  detailNewMattress: {
                    include: {
                      topFabric: true,
                      bottomFabric: true,
                      sideFabric: true,
                      foamSupply: true,
                      tapeSupply: true,
                      feetSupply: true,
                    },
                  },
                  detailNewBox: {
                    include: {
                      topFabric: true,
                      sideFabric: true,
                      feetSupply: true,
                      tapeSupply: true,
                    },
                  },
                  detailUpholsteryCleaning: {
                    include: {
                      rows: true,
                    },
                  },
                },
              },
              installments: {
                include: {
                  paymentMethod: true,
                },
                orderBy: {
                  installmentNumber: "asc",
                },
              },
            },
          },
          deliveries: true,
          orderNotes: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
      }

      return NextResponse.json({ order });
    }

    const whereClause: any = {};
    if (since) {
      whereClause.createdAt = {
        gt: new Date(since),
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          include: {
            addresses: true,
            contacts: true,
          },
        },
        seller: true,
        sale: {
          include: {
            leadSource: true,
            items: {
              include: {
                productService: true,
                detailMattressReform: {
                  include: {
                    topFabric: true,
                    sideFabric: true,
                    bottomFabric: true,
                    foamSupply: true,
                    tapeSupply: true,
                    feetSupply: true,
                  },
                },
                detailBoxReform: {
                  include: {
                    topFabric: true,
                    sideFabric: true,
                    tapeSupply: true,
                    feetSupply: true,
                  },
                },
                detailNewMattress: {
                  include: {
                    topFabric: true,
                    bottomFabric: true,
                    sideFabric: true,
                    foamSupply: true,
                    tapeSupply: true,
                    feetSupply: true,
                  },
                },
                detailNewBox: {
                  include: {
                    topFabric: true,
                    sideFabric: true,
                    feetSupply: true,
                    tapeSupply: true,
                  },
                },
                detailUpholsteryCleaning: {
                  include: {
                    rows: true,
                  },
                },
              },
            },
            installments: {
              include: {
                paymentMethod: true,
              },
              orderBy: {
                installmentNumber: "asc",
              },
            },
          },
        },
        deliveries: true,
        orderNotes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      orders,
      timestamp: new Date().toISOString(),
      count: orders.length,
    });
  } catch (error: any) {
    console.error("Erro na busca de pedidos para impressão:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar pedidos", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Registrar que um pedido foi impresso ou criar nota de impressão
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, printerType, copies } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, code: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Criar uma nota de rastreamento de impressão no pedido
    const note = await prisma.orderNote.create({
      data: {
        orderId: order.id,
        type: "INTERNAL",
        content: `Impresso via Monitor Windows (${printerType || "Térmica 80mm"} - ${copies || 1} via(s)) em ${new Date().toLocaleString("pt-BR")}`,
        createdById: user.id,
      },
    });

    return NextResponse.json({ success: true, noteId: note.id });
  } catch (error: any) {
    console.error("Erro ao registrar impressão do pedido:", error);
    return NextResponse.json(
      { error: "Erro ao registrar impressão", details: error.message },
      { status: 500 }
    );
  }
}
