import { getCategories } from "./actions"
import { CategoriesClient } from "./CategoriesClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CategoriasFinanceirasPage() {
  const categories = await getCategories()
  
  return (
    <div className="w-full">
      <CategoriesClient initialData={categories} />
    </div>
  )
}
