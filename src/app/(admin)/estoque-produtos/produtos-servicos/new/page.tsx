import { ProductForm } from "@/components/products/ProductForm"
import { createProdutoServico } from "../actions"

export default function NewProdutoServicoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-400">Novo Cadastro</h2>
        <p className="text-slate-500">Adicione um novo item ao catálogo e operação.</p>
      </div>

      <ProductForm onAction={createProdutoServico} />
    </div>
  )
}
