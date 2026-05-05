import { prisma } from "@/lib/prisma"
import { FichaTecnicaClient } from "./client-page"

export default async function FichaTecnicaList() {
  const fichas = await prisma.productRecipe.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      productService: {
        select: {
          name: true,
          operationalCategory: true
        }
      },
      items: true
    }
  })

  return <FichaTecnicaClient initialFichas={fichas} />
}
