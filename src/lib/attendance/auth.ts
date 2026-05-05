import { getUser } from "@/app/login/actions"

export async function isAttendanceAdmin() {
  const user = await getUser()
  if (!user) return false

  if (user.isSuperAdmin) return true

  const roleNames = user.roles.map((r: any) => r.role.name.toUpperCase())
  return roleNames.includes("ADMIN") || roleNames.includes("RH") || roleNames.includes("GERENTE")
}
