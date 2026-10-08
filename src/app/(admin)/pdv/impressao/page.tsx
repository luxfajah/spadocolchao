import { prisma } from "@/lib/prisma";
import { getUser } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { PrintMonitorClient } from "./PrintMonitorClient";

export const metadata = {
  title: "Central de Impressão de Pedidos PDV | Spa do Colchão",
  description: "Monitor de impressão automática em tempo real para computadores Windows e PDV.",
};

export default async function PdvImpressaoPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  // Buscar os pedidos recentes do PDV para inicialização instantânea
  const initialOrders = await prisma.order.findMany({
    take: 30,
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

  return <PrintMonitorClient initialOrders={JSON.parse(JSON.stringify(initialOrders))} />;
}
