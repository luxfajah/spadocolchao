import { getCashFlow, getCashFlowMetadata } from "./actions"
import { CashFlowClient } from "./CashFlowClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FluxoDeCaixaPage() {
  const initialData = await getCashFlow()
  const meta = await getCashFlowMetadata()
  
  return <CashFlowClient initialData={initialData} accounts={meta.accounts} categories={meta.categories} />
}
