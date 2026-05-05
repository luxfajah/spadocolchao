import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"
import { LoginForm } from "./LoginForm"

export default async function LoginPage() {
  const user = await getAuthenticatedUser()

  if (user) {
    redirect("/dashboard")
  }

  return <LoginForm />
}
