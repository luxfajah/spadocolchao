import { prisma } from "@/lib/prisma"
import { ProdutosServicosClient } from "./client-page"

export default async function ProdutosServicosList() {
  const items = await prisma.productService.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      recipes: true,
      primarySupplier: {
        select: {
          legalName: true,
          tradeName: true
        }
      }
    }
  })

  return <ProdutosServicosClient items={items} />
}
