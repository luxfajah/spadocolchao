import { prisma } from "@/lib/prisma"
import { ensureSystemConfigurationData, parameterSettingDefinitions } from "@/lib/system-config"

export async function getConfigurationHubData() {
  await ensureSystemConfigurationData()

  const [
    activeUsers,
    activeRoles,
    customPermissions,
    activeSessions,
    recentChanges,
    lastBackup,
    documentSequences,
    printerProfiles,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.role.count({ where: { status: "ACTIVE" } }),
    prisma.permission.count({ where: { isCustom: true } }),
    prisma.userSession.count({ where: { isActive: true } }),
    prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        },
      },
    }),
    prisma.backupRecord.findFirst({
      orderBy: { createdAt: "desc" },
    }),
    prisma.documentSequence.count(),
    prisma.printerProfile.count(),
  ])

  return {
    activeUsers,
    activeRoles,
    customPermissions,
    activeSessions,
    recentChanges,
    lastBackup,
    documentSequences,
    printerProfiles,
  }
}

export async function getCompanyData() {
  await ensureSystemConfigurationData()

  return prisma.companyProfile.findFirst()
}

export async function getUsersData(selectedUserId?: string) {
  await ensureSystemConfigurationData()

  const [users, roles, permissions, employees] = await Promise.all([
    prisma.user.findMany({
      include: {
        primaryRole: true,
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.role.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
    }),
    prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    }),
    prisma.employee.findMany({
      select: {
        id: true,
        fullName: true,
      },
      orderBy: { fullName: "asc" },
    }),
  ])

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null

  const [userDetail, sessions, auditEntries] = selectedUser
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: selectedUser.id },
          include: {
            primaryRole: true,
            employee: true,
            roles: {
              include: {
                role: true,
              },
            },
            permissionOverrides: {
              include: {
                permission: true,
              },
              orderBy: {
                updatedAt: "desc",
              },
            },
          },
        }),
        prisma.userSession.findMany({
          where: {
            userId: selectedUser.id,
          },
          orderBy: {
            startedAt: "desc",
          },
        }),
        prisma.auditLog.findMany({
          where: {
            userId: selectedUser.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        }),
      ])
    : [null, [], []]

  return {
    users,
    roles,
    permissions,
    employees,
    selectedUser: userDetail,
    sessions,
    auditEntries,
  }
}

export async function getRolesData(selectedRoleId?: string) {
  await ensureSystemConfigurationData()

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      include: {
        permissions: true,
        users: true,
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    }),
  ])

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null
  const selectedRolePermissions = selectedRole
    ? await prisma.rolePermission.findMany({
        where: { roleId: selectedRole.id },
      })
    : []

  return {
    roles,
    permissions,
    selectedRole,
    selectedRolePermissionIds: new Set(selectedRolePermissions.map((entry) => entry.permissionId)),
  }
}

export async function getPermissionsData() {
  await ensureSystemConfigurationData()

  const [permissions, overrides, roles] = await Promise.all([
    prisma.permission.findMany({
      include: {
        roles: true,
        userOverrides: true,
      },
      orderBy: [{ module: "asc" }, { name: "asc" }],
    }),
    prisma.userPermissionOverride.findMany({
      include: {
        user: true,
        permission: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 25,
    }),
    prisma.role.findMany({
      include: {
        permissions: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  return {
    permissions,
    overrides,
    roles,
  }
}

export async function getSecurityData() {
  await ensureSystemConfigurationData()

  const [settings, activeSessions, blockedUsers, pendingUsers, blockedList, pendingList, settingHistory, auditHistory] =
    await Promise.all([
      prisma.systemSetting.findMany({
        where: { group: "SECURITY" },
        orderBy: [{ category: "asc" }, { label: "asc" }],
      }),
      prisma.userSession.findMany({
        where: { isActive: true },
        include: {
          user: true,
        },
        orderBy: {
          lastActivityAt: "desc",
        },
      }),
      prisma.user.count({ where: { status: "BLOCKED" } }),
      prisma.user.count({ where: { status: "PENDING_ACTIVATION" } }),
      prisma.user.findMany({
        where: { status: "BLOCKED" },
        select: { id: true, name: true, email: true, username: true, blockedAt: true, blockedReason: true },
        orderBy: { blockedAt: "desc" },
        take: 25,
      }),
      prisma.user.findMany({
        where: { status: "PENDING_ACTIVATION" },
        select: { id: true, name: true, email: true, username: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.systemSettingHistory.findMany({
        where: { setting: { group: "SECURITY" } },
        include: { setting: true, changedBy: { select: { id: true, name: true, email: true } } },
        orderBy: { changedAt: "desc" },
        take: 20,
      }),
      prisma.auditLog.findMany({
        where: {
          module: "Configuracoes",
          entity: { in: ["UserSession", "SystemSetting"] },
        },
        include: { user: true, session: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])

  return {
    settings,
    activeSessions,
    blockedUsers,
    pendingUsers,
    blockedList,
    pendingList,
    settingHistory,
    auditHistory,
  }
}

export async function getParameterData() {
  await ensureSystemConfigurationData()

  const settings = await prisma.systemSetting.findMany({
    where: { group: "PARAMETERS" },
    orderBy: [{ category: "asc" }, { label: "asc" }],
  })

  return parameterSettingDefinitions.map((group) => ({
    category: group.category,
    entries: settings.filter((setting) => setting.category === group.category),
  }))
}

export async function getNumberingData() {
  await ensureSystemConfigurationData()

  return prisma.documentSequence.findMany({
    orderBy: { name: "asc" },
  })
}

export async function getPrintingData() {
  await ensureSystemConfigurationData()

  const [settings, profiles] = await Promise.all([
    prisma.systemSetting.findMany({
      where: {
        OR: [{ group: "PRINTING" }, { group: "PARAMETERS", category: "Impressao" }],
      },
      orderBy: [{ group: "asc" }, { category: "asc" }, { label: "asc" }],
    }),
    prisma.printerProfile.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  return { settings, profiles }
}

export async function getAutomationsData() {
  await ensureSystemConfigurationData()

  return prisma.systemAutomation.findMany({
    orderBy: [{ isEnabled: "desc" }, { category: "asc" }, { name: "asc" }],
  })
}

type AuditFilters = {
  userId?: string
  module?: string
  action?: string
  entity?: string
  ipAddress?: string
  startDate?: string
  endDate?: string
}

export async function getAuditData(filters: AuditFilters) {
  await ensureSystemConfigurationData()

  const where = {
    userId: filters.userId || undefined,
    module: filters.module || undefined,
    action: filters.action || undefined,
    entity: filters.entity || undefined,
    ipAddress: filters.ipAddress || undefined,
    createdAt:
      filters.startDate || filters.endDate
        ? {
            gte: filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : undefined,
            lte: filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : undefined,
          }
        : undefined,
  }

  const [logs, users] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  return {
    logs,
    users,
  }
}

export async function getBackupData() {
  await ensureSystemConfigurationData()

  const [settings, backups] = await Promise.all([
    prisma.systemSetting.findMany({
      where: { group: "BACKUP" },
      orderBy: { label: "asc" },
    }),
    prisma.backupRecord.findMany({
      include: {
        createdBy: true,
        restoredBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  return {
    settings,
    backups,
  }
}
