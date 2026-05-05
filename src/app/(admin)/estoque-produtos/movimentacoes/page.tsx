import { redirect } from "next/navigation"

export default function MovimentacoesRedirect() {
  redirect("/estoque-produtos/central-de-insumos?tab=movimentacoes")
}
