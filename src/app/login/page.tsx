import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { LoginForm } from "./LoginForm"

export default async function LoginPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const user = await getAuthenticatedUser()

  if (user) {
    redirect(searchParams.redirect || "/dashboard")
  }

  return <LoginForm redirectTo={searchParams.redirect} />
}
