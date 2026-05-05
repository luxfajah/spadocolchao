import { getFinancialDashboardData } from "./actions"
import { DashboardContent } from "./DashboardContent"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FinancialDashboardPage() {
  const data = await getFinancialDashboardData()
  
  return <DashboardContent data={data} />
}
