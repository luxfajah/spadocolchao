import { getCostCenterCategoryOptions, getCostCenters } from "./actions"
import { CCClient } from "./CCClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

function resolveSelectedPeriod(searchParams?: { period?: string }) {
  if (searchParams?.period && /^\d{4}-\d{2}$/.test(searchParams.period)) {
    return searchParams.period
  }

  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default async function CentrosDeCustoPage({
  searchParams,
}: {
  searchParams?: { period?: string }
}) {
  const selectedPeriod = resolveSelectedPeriod(searchParams)
  const [dashboard, categories] = await Promise.all([
    getCostCenters(selectedPeriod),
    getCostCenterCategoryOptions(),
  ])
  
  return (
    <div className="w-full">
      <CCClient dashboard={dashboard} categories={categories} selectedPeriod={selectedPeriod} />
    </div>
  )
}
