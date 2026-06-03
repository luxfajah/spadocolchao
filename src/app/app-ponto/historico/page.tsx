import { getEmployeeHistoryData } from "../actions"
import { PontoHistoryView } from "../_components/PontoHistoryView"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PontoHistoricoPage() {
  const historyData = await getEmployeeHistoryData()

  return <PontoHistoryView data={historyData} />
}
