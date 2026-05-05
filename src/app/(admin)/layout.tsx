import { AdminShell } from "./AdminShell"
import { requireAuthenticatedUser } from "@/lib/auth"
import { headers } from "next/headers"
import { requirePathAccess } from "@/lib/access-control"
import { getUserAvatarUrl } from "@/lib/user-avatar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser()
  const avatarUrl = await getUserAvatarUrl(user.id)
  const pathname = headers().get("x-pathname") || "/dashboard"
  const accessProfile = await requirePathAccess(user, pathname)
  const isKanban = pathname === "/vendas-clientes/kanban"

  return (
    <AdminShell
      user={{
        name: user.name,
        email: user.email,
        username: user.username,
        avatarUrl,
        roleLabel: accessProfile.roleNames.join(" | ") || "Usuario do sistema",
      }}
      access={{
        allowedAreas: accessProfile.allowedAreas,
        canAccessSettings: accessProfile.canAccessSettings,
        homeHref: accessProfile.defaultRoute,
      }}
      hideNavigation={isKanban}
    >
      {children}
    </AdminShell>
  )
}
