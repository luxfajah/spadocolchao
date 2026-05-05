import { redirect } from "next/navigation"

export default function InsumosRedirect() {
  redirect("/estoque-produtos/central-de-insumos?tab=insumos")
}
