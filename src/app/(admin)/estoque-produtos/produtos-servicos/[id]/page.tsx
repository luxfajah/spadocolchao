import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/products/ProductForm"
import { updateProdutoServico } from "../actions"
import { notFound } from "next/navigation"
import { getPricingFinancialBaseline } from "@/lib/pricing/financial-baseline"
import { getProductTechnicalSheetCost } from "@/lib/pricing/product-cost"

export default async function EditProdutoServicoPage({ params }: { params: { id: string } }) {
  const item = await prisma.productService.findUnique({ where: { id: params.id } })
  if (!item) return notFound()

  // Carrega em paralelo as métricas reais do financeiro e o custo da ficha técnica (BOM)
  const [financialBaseline, recipeCost] = await Promise.all([
    getPricingFinancialBaseline(),
    getProductTechnicalSheetCost(item.id)
  ])

  // Bind the ID to the update action
  const updateAction = updateProdutoServico.bind(null, item.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-400">Editar Cadastro: {item.name}</h2>
        <p className="text-slate-500">Atualize as informações operacionais, custos e precificação do item.</p>
      </div>

      <ProductForm 
        initialData={item} 
        onAction={updateAction}
        financialBaseline={financialBaseline}
        recipeCost={recipeCost}
      />
    </div>
  )
}
