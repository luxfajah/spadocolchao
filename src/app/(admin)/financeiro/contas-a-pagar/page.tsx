import { getPayables } from "./actions"
import { PayablePageClient } from "./PayablePageClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ContasAPagarPage() {
  const initialData = await getPayables()
  
  return <PayablePageClient initialData={initialData} />
}
