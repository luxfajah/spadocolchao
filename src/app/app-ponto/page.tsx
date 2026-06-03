import { getEmployeePunchStatus } from "./actions"
import { PontoDashboard } from "./_components/PontoDashboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AppPontoPage() {
  const statusData = await getEmployeePunchStatus()

  return <PontoDashboard initialData={statusData} />
}
