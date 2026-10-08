const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const saleIds = [
    "cmuz3vptk0002112zvc5nov9j",
    "cmuz5xxsu0002vnh986t3kkwy",
    "cmuz7e3w500029n9lrfjlvs5p",
    "cmuzy7i1l0002q6x5zuoue9xz",
    "cmuzyq7310002117io1aivljm",
    "cmuzzodaz00024lcvpckieknd"
  ];

  console.log("Iniciando exclusão limpa e em cascata das 6 vendas de teste...");

  const orders = await prisma.order.findMany({
    where: { saleId: { in: saleIds } },
    select: { id: true }
  });
  const orderIds = orders.map(o => o.id);

  const saleItems = await prisma.saleItem.findMany({
    where: { saleId: { in: saleIds } },
    select: { id: true }
  });
  const saleItemIds = saleItems.map(i => i.id);

  const slips = await prisma.orderProductionSlip.findMany({
    where: { orderId: { in: orderIds } },
    select: { id: true }
  });
  const slipIds = slips.map(s => s.id);

  await prisma.$transaction(async (tx) => {
    // 1. Slip lines
    if (slipIds.length > 0 || saleItemIds.length > 0) {
      await tx.orderProductionSlipLine.deleteMany({
        where: {
          OR: [
            { productionSlipId: { in: slipIds } },
            { saleItemId: { in: saleItemIds } }
          ]
        }
      });
    }

    // 2. Slips
    if (orderIds.length > 0) {
      await tx.orderProductionSlip.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // 3. Deliveries
      await tx.orderDelivery.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // 4. Notes
      await tx.orderNote.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // 5. History
      await tx.orderStatusHistory.deleteMany({
        where: { orderId: { in: orderIds } }
      });

      // 6. Orders
      await tx.order.deleteMany({
        where: { id: { in: orderIds } }
      });
    }

    // 7. Installments
    await tx.saleInstallment.deleteMany({
      where: { saleId: { in: saleIds } }
    });

    // 8. Reform details
    await tx.saleItemDetailMattressReform.deleteMany({
      where: { saleItemId: { in: saleItemIds } }
    });
    await tx.saleItemDetailBoxReform.deleteMany({
      where: { saleItemId: { in: saleItemIds } }
    });

    // 9. Items
    await tx.saleItem.deleteMany({
      where: { saleId: { in: saleIds } }
    });

    // 10. Sales
    const res = await tx.sale.deleteMany({
      where: { id: { in: saleIds } }
    });

    console.log(`✅ Sucesso! ${res.count} vendas de teste foram completamente removidas.`);
  });
}

main()
  .catch((e) => {
    console.error("Erro na exclusão:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
