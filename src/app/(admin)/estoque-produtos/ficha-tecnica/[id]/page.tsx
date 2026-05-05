import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { FichaTecnicaForm } from "../components/FichaTecnicaForm"

export default async function FichaTecnicaPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "nova"

  // Load product services for linking
  const productServices = await prisma.productService.findMany({
    orderBy: { name: "asc" },
  })

  // Load supply items for the composition
  const supplyItems = await prisma.supplyItem.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  })

  // Load existing data if edit mode
  let initialData = null
  if (!isNew) {
    initialData = await prisma.productRecipe.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            rules: true,
            supplyItem: {
              include: { category: true }
            }
          },
          orderBy: { displayOrder: "asc" }
        }
      }
    })

    if (!initialData) {
      return notFound()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-brand-900">
          {isNew ? "Nova Ficha Técnica" : `Editar Ficha Técnica: ${initialData?.name}`}
        </h2>
        <p className="text-slate-500">
          Configure a estrutura de produção, consumo de insumos e regras de custo.
        </p>
      </div>

      <FichaTecnicaForm 
        initialData={initialData} 
        productServices={productServices} 
        supplyItems={supplyItems} 
      />
    </div>
  )
}
