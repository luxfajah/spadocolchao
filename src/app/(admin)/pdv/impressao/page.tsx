import { prisma } from "@/lib/prisma";
import { getUser } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { PrintMonitorClient } from "./PrintMonitorClient";

export const metadata = {
  title: "Central de Impressão de Pedidos PDV | Spa do Colchão",
  description: "Monitor de impressão automática em tempo real para computadores Windows e PDV.",
};

const orderInclude = {
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
          installmentNumber: "asc" as const,
        },
      },
    },
  },
  deliveries: true,
  orderNotes: {
    orderBy: { createdAt: "desc" as const },
  },
};

export default async function PdvImpressaoPage({
  searchParams,
}: {
  searchParams?: {
    orderId?: string;
    id?: string;
    guia?: "both" | "production" | "customer";
    autoprint?: string;
  };
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const targetId = searchParams?.orderId || searchParams?.id;

  // Buscar pedido específico se fornecido via parâmetro
  let targetOrder: any = null;
  if (targetId) {
    try {
      targetOrder = await prisma.order.findUnique({
        where: { id: targetId },
        include: orderInclude,
      });
    } catch (_err) {}
  }

  // Buscar os pedidos recentes do PDV para inicialização instantânea
  const recentOrders = await prisma.order.findMany({
    take: 30,
    orderBy: {
      createdAt: "desc",
    },
    include: orderInclude,
  });

  const combinedOrders = targetOrder
    ? [targetOrder, ...recentOrders.filter((o) => o.id !== targetOrder.id)]
    : recentOrders;

  return (
    <PrintMonitorClient
      initialOrders={JSON.parse(JSON.stringify(combinedOrders))}
      initialSelectedOrderId={targetId}
      initialGuiaMode={searchParams?.guia}
      initialAutoPrint={searchParams?.autoprint === "true" || searchParams?.autoprint === "1"}
    />
  );
}

