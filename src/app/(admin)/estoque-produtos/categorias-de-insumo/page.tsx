import { redirect } from "next/navigation"

export default function CategoriasRedirect() {
  redirect("/estoque-produtos/central-de-insumos?tab=categorias")
}
