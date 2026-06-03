import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getUserAccessProfile } from "@/lib/access-control"
import { headers } from "next/headers"

export default async function Home() {
  const headersList = await headers()
  const userAgent = (headersList.get('user-agent') || '').toLowerCase()

  if (userAgent.includes('capacitorvendedor')) {
    redirect('/app-vendedor/pdv')
  }
  
  if (userAgent.includes('capacitorentregador') || userAgent.includes('spadocolchaoentregadorapp')) {
    redirect('/app-entregador')
  }

  if (userAgent.includes('capacitorponto')) {
    redirect('/app-ponto')
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login")
  }
  const accessProfile = await getUserAccessProfile(user)
  redirect(accessProfile.defaultRoute)
}
