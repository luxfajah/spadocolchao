import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/products/ProductForm"
import { updateProdutoServico } from "../actions"
import { notFound } from "next/navigation"

export default async function EditProdutoServicoPage({ params }: { params: { id: string } }) {
  const item = await prisma.productService.findUnique({ where: { id: params.id } })
  if (!item) return notFound()

  // Bind the ID to the update action
  const updateAction = updateProdutoServico.bind(null, item.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-400">Editar Cadastro: {item.name}</h2>
        <p className="text-slate-500">Atualize as informações operacionais e comerciais do item.</p>
      </div>

      <ProductForm initialData={item} onAction={updateAction} />
    </div>
  )
}
