import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getUserAccessProfile } from "@/lib/access-control"

export default async function Home() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login")
  }
  const accessProfile = await getUserAccessProfile(user)
  redirect(accessProfile.defaultRoute)
}
