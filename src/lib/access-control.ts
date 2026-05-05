import "server-only"

import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ensureSystemConfigurationData } from "@/lib/system-config"
import {
  accessPresetDefinitions,
  type AccessPresetKey,
  type AppArea,
  type DashboardVariant,
  type KanbanMode,
  type SellerScope,
  findSystemRoleDefinition,
  normalizeRoleLabel,
} from "@/lib/role-presets"
import type { UserRoleName } from "@/lib/order-flow"

type AuthenticatedUserLike = {
  id: string
  name: string
  email: string | null
  username: string
  employeeId?: string | null
  isSuperAdmin?: boolean
  primaryRole?: {
    name: string
  } | null
  roles: Array<{
    role: {
      name: string
    }
  }>
}

type SellerScopeUserLike = Pick<AuthenticatedUserLike, "name" | "email" | "username" | "employeeId">

export type UserAccessProfile = {
  roleNames: string[]
  accessPresetKeys: AccessPresetKey[]
  allowedAreas: AppArea[]
  permissionCodes: string[]
  dashboardVariant: DashboardVariant
  defaultRoute: string
  orderFlowRole: UserRoleName | null
  sellerScope: SellerScope
  kanbanMode: KanbanMode
  canAccessSettings: boolean
}

export type SellerScopeContext = {
  sellerId: string | null
  sellerLinked: boolean
  restrictToOwnPortfolio: boolean
}

const areaPermissionFallbacks: Record<AppArea, string[]> = {
  dashboard: [],
  pdv: ["pdv.view"],
  sales: ["comercial.view"],
  customers: ["comercial.view"],
  orders: ["pedidos.view"],
  kanban: ["pedidos.view"],
  commissions: ["comercial.view"],
  financial: ["financeiro.view"],
  supplies: ["suprimentos.view"],
  hr: ["rh.view"],
  settings: ["configuracoes.view", "configuracoes.manage_settings"],
}

const routeAreaRules: Array<{ prefix: string; area: AppArea }> = [
  { prefix: "/configuracoes", area: "settings" },
  { prefix: "/rh", area: "hr" },
  { prefix: "/financeiro", area: "financial" },
  { prefix: "/estoque-produtos", area: "supplies" },
  { prefix: "/pdv", area: "pdv" },
  { prefix: "/vendas-clientes/kanban", area: "kanban" },
  { prefix: "/vendas-clientes/pedidos", area: "orders" },
  { prefix: "/vendas-clientes/clientes", area: "customers" },
  { prefix: "/vendas-clientes/comissoes", area: "commissions" },
  { prefix: "/vendas-clientes/vendas", area: "sales" },
  { prefix: "/dashboard", area: "dashboard" },
]

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]))
}

function uniqueAreas(values: AppArea[]) {
  return Array.from(new Set(values))
}

function resolvePrimaryPresetKey(accessPresetKeys: AccessPresetKey[]) {
  return [...accessPresetKeys].sort(
    (left, right) => accessPresetDefinitions[right].priority - accessPresetDefinitions[left].priority,
  )[0]
}

function resolveRouteArea(pathname: string) {
  return routeAreaRules.find((rule) => pathname.startsWith(rule.prefix))?.area ?? null
}

async function loadEffectivePermissionCodes(userId: string) {
  const permissionState = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: {
        select: {
          role: {
            select: {
              permissions: {
                select: {
                  permission: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      permissionOverrides: {
        select: {
          effect: true,
          permission: {
            select: {
              code: true,
            },
          },
        },
      },
    },
  })

  const permissionCodes = new Set<string>()

  permissionState?.roles.forEach((roleEntry) => {
    roleEntry.role.permissions.forEach((permissionEntry) => {
      permissionCodes.add(permissionEntry.permission.code)
    })
  })

  permissionState?.permissionOverrides.forEach((override) => {
    if (override.effect === "DENY") {
      permissionCodes.delete(override.permission.code)
      return
    }

    permissionCodes.add(override.permission.code)
  })

  return Array.from(permissionCodes)
}

function deriveAreasFromPermissions(permissionCodes: string[]) {
  const codeSet = new Set(permissionCodes)

  return (Object.keys(areaPermissionFallbacks) as AppArea[]).filter((area) =>
    areaPermissionFallbacks[area].some((permissionCode) => codeSet.has(permissionCode)),
  )
}

function normalizeEmail(value?: string | null) {
  return (value || "").trim().toLowerCase()
}

function normalizeText(value?: string | null) {
  return normalizeRoleLabel(value)
}

export async function getUserAccessProfile(user: AuthenticatedUserLike): Promise<UserAccessProfile> {
  await ensureSystemConfigurationData()

  const roleNames = uniqueStrings([
    user.primaryRole?.name,
    ...user.roles.map((roleEntry) => roleEntry.role.name),
  ])

  const accessPresetKeys = uniqueStrings(
    roleNames.map((roleName) => findSystemRoleDefinition(roleName)?.accessPresetKey),
  ) as AccessPresetKey[]
  const permissionCodes = await loadEffectivePermissionCodes(user.id)

  if (user.isSuperAdmin) {
    return {
      roleNames,
      accessPresetKeys: ["ADMINISTRADOR"],
      allowedAreas: accessPresetDefinitions.ADMINISTRADOR.areas,
      permissionCodes,
      dashboardVariant: "full",
      defaultRoute: "/dashboard",
      orderFlowRole: "ADMIN",
      sellerScope: "all",
      kanbanMode: "full",
      canAccessSettings: true,
    }
  }

  const primaryPresetKey = resolvePrimaryPresetKey(accessPresetKeys)
  const presetAreas = accessPresetKeys.flatMap((presetKey) => accessPresetDefinitions[presetKey].areas)
  const permissionAreas = deriveAreasFromPermissions(permissionCodes)
  const allowedAreas = uniqueAreas(["dashboard", ...presetAreas, ...permissionAreas])
  const primaryPreset = primaryPresetKey ? accessPresetDefinitions[primaryPresetKey] : null

  return {
    roleNames,
    accessPresetKeys,
    allowedAreas,
    permissionCodes,
    dashboardVariant: primaryPreset?.dashboardVariant || "full",
    defaultRoute: primaryPreset?.defaultRoute || "/dashboard",
    orderFlowRole: primaryPreset?.orderFlowRole || null,
    sellerScope: primaryPreset?.sellerScope || "all",
    kanbanMode: primaryPreset?.kanbanMode || "view",
    canAccessSettings: allowedAreas.includes("settings"),
  }
}

export function hasAreaAccess(profile: UserAccessProfile, area: AppArea) {
  return profile.allowedAreas.includes(area)
}

export function getOrdersViewMode(profile: UserAccessProfile): "full" | "sales" | "kanban-only" {
  if (!hasAreaAccess(profile, "orders") && hasAreaAccess(profile, "kanban")) {
    return "kanban-only"
  }

  if (profile.dashboardVariant === "sales") {
    return "sales"
  }

  return "full"
}

export function ensurePathAccess(profile: UserAccessProfile, pathname: string) {
  const routeArea = resolveRouteArea(pathname)

  if (!routeArea || hasAreaAccess(profile, routeArea)) {
    return profile
  }

  redirect(profile.defaultRoute)
}

export async function requirePathAccess(user: AuthenticatedUserLike, pathname: string) {
  const profile = await getUserAccessProfile(user)
  return ensurePathAccess(profile, pathname)
}

export async function assertAreaAccess(user: AuthenticatedUserLike, area: AppArea) {
  const profile = await getUserAccessProfile(user)

  if (!hasAreaAccess(profile, area)) {
    throw new Error("Usuario sem permissao para este modulo.")
  }

  return profile
}

export async function getUserSellerScopeContext(
  user: SellerScopeUserLike,
  profile: UserAccessProfile,
): Promise<SellerScopeContext> {
  if (profile.sellerScope !== "self") {
    return {
      sellerId: null,
      sellerLinked: true,
      restrictToOwnPortfolio: false,
    }
  }

  const normalizedUserEmail = normalizeEmail(user.email)
  const normalizedUserName = normalizeText(user.name)
  const normalizedUsername = normalizeText(user.username)

  const sellers = await prisma.seller.findMany({
    where: {
      isActive: true,
      OR: [
        ...(user.employeeId ? [{ employeeId: user.employeeId }] : []),
        ...(normalizedUserEmail ? [{ email: normalizedUserEmail }] : []),
        { type: "INTERNAL" },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      type: true,
    },
    orderBy: [{ employeeId: "desc" }, { name: "asc" }],
  })

  const matchedSeller =
    sellers.find((seller) => seller.employeeId && seller.employeeId === user.employeeId) ||
    sellers.find((seller) => normalizedUserEmail && normalizeEmail(seller.email) === normalizedUserEmail) ||
    sellers.find((seller) => {
      const sellerName = normalizeText(seller.name)
      return sellerName === normalizedUserName || sellerName === normalizedUsername
    }) ||
    null

  return {
    sellerId: matchedSeller?.id || null,
    sellerLinked: Boolean(matchedSeller),
    restrictToOwnPortfolio: true,
  }
}
