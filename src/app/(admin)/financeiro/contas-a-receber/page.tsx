import { getReceivables } from "./actions"
import { ReceivablePageClient } from "./ReceivablePageClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ContasAReceberPage() {
  const initialData = await getReceivables()
  
  return <ReceivablePageClient initialData={initialData} />
}
