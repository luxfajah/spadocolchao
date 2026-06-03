import { getEmployeeHistoryData } from "../actions"
import { PontoHistoryView } from "../_components/PontoHistoryView"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface PageProps {
  searchParams?: {
    period?: string
  }
}

export default async function PontoHistoricoPage({ searchParams }: PageProps) {
  const period = searchParams?.period
  const historyData = await getEmployeeHistoryData(period)

  return <PontoHistoryView data={historyData} />
}
