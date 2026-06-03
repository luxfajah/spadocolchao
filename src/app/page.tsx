import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getUserAccessProfile } from "@/lib/access-control"
import { headers } from "next/headers"

export default async function Home() {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  if (userAgent.includes('CapacitorVendedor')) {
    redirect('/app-vendedor/pdv')
  }
  
  if (userAgent.includes('CapacitorEntregador')) {
    redirect('/app-entregador/pedidos')
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login")
  }
  const accessProfile = await getUserAccessProfile(user)
  redirect(accessProfile.defaultRoute)
}
