import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { getUserAccessProfile } from "@/lib/access-control"
import { LoginForm } from "./LoginForm"

export default async function LoginPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const user = await getAuthenticatedUser()

  if (user) {
    if (searchParams.redirect) {
      redirect(searchParams.redirect)
    } else {
      const accessProfile = await getUserAccessProfile(user)
      redirect(accessProfile.defaultRoute)
    }
  }

  return <LoginForm redirectTo={searchParams.redirect} />
}
