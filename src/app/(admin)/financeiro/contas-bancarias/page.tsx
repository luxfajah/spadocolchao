import { getAccounts } from "./actions"
import { AccountClient } from "./AccountClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ContasBancariasPage() {
  const accounts = await getAccounts()
  
  return <AccountClient initialData={accounts} />
}
