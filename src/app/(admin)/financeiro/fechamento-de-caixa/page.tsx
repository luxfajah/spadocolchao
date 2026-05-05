import { getCashSessions } from "./actions"
import { SessionClient } from "./SessionClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FechamentoDeCaixaPage() {
  const sessions = await getCashSessions()
  
  return <SessionClient initialData={sessions} />
}
