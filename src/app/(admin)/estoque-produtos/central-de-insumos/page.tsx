import { redirect } from "next/navigation"

export default function RedirectPage() {
  redirect("/estoque-produtos/suprimentos?tab=insumos")
}
