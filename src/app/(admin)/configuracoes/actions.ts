"use server"

import { copyFile, mkdir, stat } from "fs/promises"
import path from "path"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import {
  destroySessionById,
  destroyUserSessions,
  getAuthenticatedUser,
  hashPassword,
  normalizeEmail,
} from "@/lib/auth"
import { assertAreaAccess } from "@/lib/access-control"
import { prisma } from "@/lib/prisma"
import { accessPresetDefinitions, assignableSystemRoleDefinitions, type AccessPresetKey } from "@/lib/role-presets"
import { ensureSystemConfigurationData } from "@/lib/system-config"
import { uploadFile } from "@/lib/storage-service"

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function readNullable(formData: FormData, key: string) {
  const value = readString(formData, key)
  return value || null
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  return value === "on" || value === "true" || value === "1"
}

function readClientMetadata() {
  const headerStore = headers()
  const forwardedFor = headerStore.get("x-forwarded-for")

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null,
    userAgent: headerStore.get("user-agent") || null,
  }
}

async function requireActor() {
  const actor = await getAuthenticatedUser()
  if (!actor) {
    throw new Error("Usuário não autenticado")
  }

  await ensureSystemConfigurationData()
  await assertAreaAccess(actor, "settings")
  return actor
}

async function ensureUniqueUserIdentity(input: { email: string; username: string; ignoreUserId?: string }) {
  const conflict = await prisma.user.findFirst({
    where: {
      id: input.ignoreUserId
        ? {
            not: input.ignoreUserId,
          }
        : undefined,
      OR: [{ email: input.email }, { username: input.username }],
    },
    select: {
      email: true,
      username: true,
    },
  })

  if (!conflict) {
    return
  }

  if (conflict.email === input.email) {
    throw new Error("Este e-mail já está em uso por outro usuário.")
  }

  if (conflict.username === input.username) {
    throw new Error("Este nome de usuário já está em uso por outro usuário.")
  }
}

async function resolvePresetAssignment(formData: FormData) {
  const rolePresetKey = readNullable(formData, "rolePresetKey") as AccessPresetKey | null

  if (!rolePresetKey) {
    return null
  }

  const presetRoleDefinition = assignableSystemRoleDefinitions.find(
    (roleDefinition) => roleDefinition.accessPresetKey === rolePresetKey,
  )

  if (!presetRoleDefinition) {
    return null
  }

  const presetRole = await prisma.role.findFirst({
    where: {
      name: presetRoleDefinition.roleName,
      status: {
        not: "ARCHIVED",
      },
    },
  })

  if (!presetRole) {
    throw new Error("Perfil padrão não encontrado. Recarregue a configuração de perfis.")
  }

  const presetMetadata = accessPresetDefinitions[rolePresetKey]

  return {
    rolePresetKey,
    presetRoleName: presetRoleDefinition.roleName,
    primaryRoleId: presetRole.id,
    roleIds: [presetRole.id],
    jobTitle: presetMetadata.defaultJobTitle,
    department: presetMetadata.defaultDepartment,
  }
}

async function createAuditEntry(input: {
  userId: string
  module: string
  action: string
  entity: string
  entityId?: string | null
  description: string
  details?: string | null
  sessionId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const metadata = readClientMetadata()

  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId ?? null,
      module: input.module,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      description: input.description,
      details: input.details,
      origin: "CONFIGURAÇÕES",
      ipAddress: input.ipAddress ?? metadata.ipAddress,
      userAgent: input.userAgent ?? metadata.userAgent,
    },
  })
}

async function writeSettingValue(settingId: string, newValue: string, changedById: string, note?: string) {
  const currentSetting = await prisma.systemSetting.findUnique({
    where: { id: settingId },
  })

  if (!currentSetting || currentSetting.value === newValue) {
    return
  }

  await prisma.systemSetting.update({
    where: { id: settingId },
    data: {
      value: newValue,
    },
  })

  await prisma.systemSettingHistory.create({
    data: {
      settingId,
      previousValue: currentSetting.value,
      newValue,
      changedById,
      note: note || null,
    },
  })
}

export async function saveCompanyProfileAction(formData: FormData) {
  const actor = await requireActor()
  const existingCompany = await prisma.companyProfile.findFirst()

  const data = {
    legalName: readString(formData, "legalName"),
    tradeName: readNullable(formData, "tradeName"),
    cnpj: readNullable(formData, "cnpj"),
    stateRegistration: readNullable(formData, "stateRegistration"),
    municipalRegistration: readNullable(formData, "municipalRegistration"),
    zipCode: readNullable(formData, "zipCode"),
    street: readNullable(formData, "street"),
    number: readNullable(formData, "number"),
    complement: readNullable(formData, "complement"),
    neighborhood: readNullable(formData, "neighborhood"),
    city: readNullable(formData, "city"),
    state: readNullable(formData, "state"),
    phone: readNullable(formData, "phone"),
    whatsapp: readNullable(formData, "whatsapp"),
    email: readNullable(formData, "email"),
    website: readNullable(formData, "website"),
    logoUrl: readNullable(formData, "logoUrl"),
    legalRepresentative: readNullable(formData, "legalRepresentative"),
    printName: readNullable(formData, "printName"),
    printDocument: readNullable(formData, "printDocument"),
    printAddress: readNullable(formData, "printAddress"),
    printPhone: readNullable(formData, "printPhone"),
    printFooter: readNullable(formData, "printFooter"),
    operationalEmail: readNullable(formData, "operationalEmail"),
    operationalHours: readNullable(formData, "operationalHours"),
    operationalNotes: readNullable(formData, "operationalNotes"),
  }

  const company = existingCompany
    ? await prisma.companyProfile.update({
        where: { id: existingCompany.id },
        data,
      })
    : await prisma.companyProfile.create({
        data,
      })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "save_company",
    entity: "CompanyProfile",
    entityId: company.id,
    description: "Dados da empresa atualizados.",
    details: JSON.stringify(data),
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/empresa")
}

export async function createUserAction(formData: FormData) {
  const actor = await requireActor()
  const email = normalizeEmail(readString(formData, "email"))
  const username = readString(formData, "username")
  const presetAssignment = await resolvePresetAssignment(formData)
  const primaryRoleId = presetAssignment?.primaryRoleId ?? readNullable(formData, "primaryRoleId")
  const additionalRoleIds = formData.getAll("additionalRoleId").map((value) => String(value))
  const roleIds = presetAssignment?.roleIds ?? Array.from(new Set([primaryRoleId, ...additionalRoleIds].filter(Boolean) as string[]))
  const initialPassword = readString(formData, "initialPassword")

  if (!email || !username || !initialPassword) {
    throw new Error("E-mail, nome de usuário e senha inicial são obrigatórios")
  }

  await ensureUniqueUserIdentity({ email, username })

  const avatarFile = formData.get("avatar") as File | null;
  let avatarUrl: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    avatarUrl = await uploadFile(`avatars/user-${Date.now()}-${avatarFile.name}`, buffer, avatarFile.type);
  }

  const user = await prisma.user.create({
    data: {
      name: readString(formData, "name"),
      socialName: readNullable(formData, "socialName"),
      email,
      phone: readNullable(formData, "phone"),
      username,
      passwordHash: hashPassword(initialPassword),
      status: readString(formData, "status") || "PENDING_ACTIVATION",
      jobTitle: presetAssignment?.jobTitle ?? readNullable(formData, "jobTitle"),
      department: presetAssignment?.department ?? readNullable(formData, "department"),
      primaryRoleId,
      employeeId: readNullable(formData, "employeeId"),
      notes: readNullable(formData, "notes"),
      mustChangePassword: true,
      avatarUrl,
    },
  })

  for (const roleId of roleIds) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId,
      },
    })
  }

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "create",
    entity: "User",
    entityId: user.id,
    description: "Usuário criado no módulo de configurações.",
    details: JSON.stringify({ email, roleIds, rolePresetKey: presetAssignment?.rolePresetKey || null }),
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/usuarios")
}

export async function updateUserGeneralAction(formData: FormData) {
  const actor = await requireActor()
  const userId = readString(formData, "userId")
  const email = normalizeEmail(readString(formData, "email"))
  const username = readString(formData, "username")

  if (!email || !username) {
    throw new Error("E-mail e nome de usuário são obrigatórios.")
  }

  await ensureUniqueUserIdentity({ email, username, ignoreUserId: userId })

  const avatarFile = formData.get("avatar") as File | null;
  let avatarUrl: string | undefined;

  if (avatarFile && avatarFile.size > 0) {
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    avatarUrl = await uploadFile(`avatars/user-${userId}-${Date.now()}-${avatarFile.name}`, buffer, avatarFile.type);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: readString(formData, "name"),
      socialName: readNullable(formData, "socialName"),
      email,
      phone: readNullable(formData, "phone"),
      username,
      jobTitle: readNullable(formData, "jobTitle"),
      department: readNullable(formData, "department"),
      employeeId: readNullable(formData, "employeeId"),
      notes: readNullable(formData, "notes"),
      status: readString(formData, "status") || "ACTIVE",
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "edit",
    entity: "User",
    entityId: userId,
    description: "Dados gerais do usuário atualizados.",
    details: JSON.stringify({ email }),
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/usuarios")
}

export async function updateUserRolesAction(formData: FormData) {
  const actor = await requireActor()
  const userId = readString(formData, "userId")
  const presetAssignment = await resolvePresetAssignment(formData)
  const primaryRoleId = presetAssignment?.primaryRoleId ?? readNullable(formData, "primaryRoleId")
  const additionalRoleIds = formData.getAll("additionalRoleId").map((value) => String(value))
  const roleIds = presetAssignment?.roleIds ?? Array.from(new Set([primaryRoleId, ...additionalRoleIds].filter(Boolean) as string[]))

  await prisma.user.update({
    where: { id: userId },
    data: {
      primaryRoleId,
      jobTitle: presetAssignment?.jobTitle ?? undefined,
      department: presetAssignment?.department ?? undefined,
    },
  })

  await prisma.userRole.deleteMany({
    where: { userId },
  })

  for (const roleId of roleIds) {
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    })
  }

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "edit_roles",
    entity: "User",
    entityId: userId,
    description: "Perfis de acesso do usuário atualizados.",
    details: JSON.stringify({ primaryRoleId, roleIds, rolePresetKey: presetAssignment?.rolePresetKey || null }),
  })

  revalidatePath("/configuracoes/usuarios")
}

export async function setUserPermissionOverrideAction(formData: FormData) {
  const actor = await requireActor()
  const userId = readString(formData, "userId")
  const permissionId = readString(formData, "permissionId")
  const effect = readString(formData, "effect")
  const notes = readNullable(formData, "notes")

  const override = await prisma.userPermissionOverride.upsert({
    where: {
      userId_permissionId: {
        userId,
        permissionId,
      },
    },
    update: {
      effect,
      notes,
    },
    create: {
      userId,
      permissionId,
      effect,
      notes,
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "override_permission",
    entity: "UserPermissionOverride",
    entityId: override.id,
    description: "Permissão extra atribuída ao usuário.",
    details: JSON.stringify({ userId, permissionId, effect }),
  })

  revalidatePath("/configuracoes/usuarios")
  revalidatePath("/configuracoes/permissoes")
}

export async function removeUserPermissionOverrideAction(formData: FormData) {
  const actor = await requireActor()
  const overrideId = readString(formData, "overrideId")

  const existingOverride = await prisma.userPermissionOverride.findUnique({
    where: { id: overrideId },
  })

  if (!existingOverride) {
    return
  }

  await prisma.userPermissionOverride.delete({
    where: { id: overrideId },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "remove_override",
    entity: "UserPermissionOverride",
    entityId: overrideId,
    description: "Sobrescrita de permissão removida.",
    details: JSON.stringify(existingOverride),
  })

  revalidatePath("/configuracoes/usuarios")
  revalidatePath("/configuracoes/permissoes")
}

export async function resetUserPasswordAction(formData: FormData) {
  const actor = await requireActor()
  const userId = readString(formData, "userId")
  const newPassword = readString(formData, "newPassword")

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      blockedAt: null,
      blockedReason: null,
      status: "ACTIVE",
    },
  })

  await destroyUserSessions(userId, "PASSWORD_RESET")

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "reset_password",
    entity: "User",
    entityId: userId,
    description: "Senha do usuário redefinida.",
  })

  revalidatePath("/configuracoes/usuarios")
  revalidatePath("/configuracoes/seguranca")
}

export async function setUserStatusAction(formData: FormData) {
  const actor = await requireActor()
  const userId = readString(formData, "userId")
  const status = readString(formData, "status")
  const reason = readNullable(formData, "reason")

  await prisma.user.update({
    where: { id: userId },
    data: {
      status,
      blockedAt: status === "BLOCKED" ? new Date() : null,
      blockedReason: status === "BLOCKED" ? reason : null,
      failedLoginAttempts: status === "BLOCKED" ? 5 : 0,
    },
  })

  if (status !== "ACTIVE") {
    await destroyUserSessions(userId, `STATUS_${status}`)
  }

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "change_status",
    entity: "User",
    entityId: userId,
    description: `Status do usuário alterado para ${status}.`,
    details: reason,
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/usuarios")
  revalidatePath("/configuracoes/seguranca")
}

export async function terminateSessionAction(formData: FormData) {
  const actor = await requireActor()
  const sessionId = readString(formData, "sessionId")

  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })

  if (!session) {
    throw new Error("Sessão não encontrada.")
  }

  if (session.userId === actor.id) {
    return
  }

  await destroySessionById(sessionId, "FORCED_BY_ADMIN")

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "force_logout",
    entity: "UserSession",
    entityId: sessionId,
    description: "Sessão encerrada manualmente.",
    sessionId,
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/usuarios")
  revalidatePath("/configuracoes/seguranca")
}

export async function terminateAllUserSessionsAction(formData: FormData) {
  const actor = await requireActor()
  const userId = readString(formData, "userId")

  if (userId === actor.id) {
    return
  }

  await destroyUserSessions(userId, "FORCED_BY_ADMIN_ALL")

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "force_logout_all",
    entity: "UserSession",
    entityId: userId,
    description: "Todas as sessões do usuário foram encerradas.",
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/usuarios")
  revalidatePath("/configuracoes/seguranca")
}

export async function saveRoleAction(formData: FormData) {
  const actor = await requireActor()
  const roleId = readNullable(formData, "roleId")
  const data = {
    name: readString(formData, "name"),
    description: readNullable(formData, "description"),
    status: readString(formData, "status") || "ACTIVE",
    notes: readNullable(formData, "notes"),
  }

  const role = roleId
    ? await prisma.role.update({
        where: { id: roleId },
        data,
      })
    : await prisma.role.create({
        data: {
          ...data,
          isSystem: false,
        },
      })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: roleId ? "edit" : "create",
    entity: "Role",
    entityId: role.id,
    description: roleId ? "Perfil de acesso atualizado." : "Perfil de acesso criado.",
    details: JSON.stringify(data),
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/perfis-de-acesso")
}

export async function duplicateRoleAction(formData: FormData) {
  const actor = await requireActor()
  const roleId = readString(formData, "roleId")

  const sourceRole = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: true,
    },
  })

  if (!sourceRole) {
    return
  }

  const duplicatedRole = await prisma.role.create({
    data: {
      name: `${sourceRole.name} Cópia`,
      description: sourceRole.description,
      status: "ACTIVE",
      notes: sourceRole.notes,
      isSystem: false,
    },
  })

  for (const permissionLink of sourceRole.permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: duplicatedRole.id,
        permissionId: permissionLink.permissionId,
      },
    })
  }

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "duplicate",
    entity: "Role",
    entityId: duplicatedRole.id,
    description: "Perfil de acesso duplicado.",
    details: JSON.stringify({ sourceRoleId: roleId }),
  })

  revalidatePath("/configuracoes/perfis-de-acesso")
}

export async function toggleRoleStatusAction(formData: FormData) {
  const actor = await requireActor()
  const roleId = readString(formData, "roleId")
  const nextStatus = readString(formData, "nextStatus")

  await prisma.role.update({
    where: { id: roleId },
    data: {
      status: nextStatus,
      archivedAt: nextStatus === "ARCHIVED" ? new Date() : null,
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "change_status",
    entity: "Role",
    entityId: roleId,
    description: `Status do perfil alterado para ${nextStatus}.`,
  })

  revalidatePath("/configuracoes/perfis-de-acesso")
}

export async function archiveRoleAction(formData: FormData) {
  const actor = await requireActor()
  const roleId = readString(formData, "roleId")

  await prisma.role.update({
    where: { id: roleId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "archive",
    entity: "Role",
    entityId: roleId,
    description: "Perfil de acesso arquivado.",
  })

  revalidatePath("/configuracoes/perfis-de-acesso")
}

export async function updateRolePermissionsAction(formData: FormData) {
  const actor = await requireActor()
  const roleId = readString(formData, "roleId")
  const permissionIds = formData.getAll("permissionId").map((value) => String(value))

  await prisma.rolePermission.deleteMany({
    where: { roleId },
  })

  for (const permissionId of permissionIds) {
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    })
  }

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "edit_permissions",
    entity: "Role",
    entityId: roleId,
    description: "Permissões do perfil atualizadas.",
    details: JSON.stringify({ permissionCount: permissionIds.length }),
  })

  revalidatePath("/configuracoes/perfis-de-acesso")
  revalidatePath("/configuracoes/permissoes")
}

export async function createCustomPermissionAction(formData: FormData) {
  const actor = await requireActor()

  const permission = await prisma.permission.create({
    data: {
      code: readString(formData, "code"),
      name: readString(formData, "name"),
      module: readString(formData, "module"),
      action: readNullable(formData, "action"),
      description: readNullable(formData, "description"),
      status: "ACTIVE",
      isCustom: true,
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configurações",
    action: "create",
    entity: "Permission",
    entityId: permission.id,
    description: "Permissão customizada criada.",
    details: JSON.stringify(permission),
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/permissoes")
}

export async function saveSettingsCollectionAction(formData: FormData) {
  const actor = await requireActor()
  const redirectPath = readString(formData, "redirectPath") || "/configuracoes"
  const settingIds = formData.getAll("settingId").map((value) => String(value))

  const settings = await prisma.systemSetting.findMany({
    where: { id: { in: settingIds } },
  })
  const settingsMap = new Map(settings.map((setting) => [setting.id, setting]))

  for (const settingId of settingIds) {
    const setting = settingsMap.get(settingId)
    if (!setting) {
      continue
    }

    const rawValue = formData.get(`value:${settingId}`)
    const valueStr = rawValue instanceof File ? "" : Array.isArray(rawValue) ? rawValue.join(",") : String(rawValue ?? "")
    let normalizedValue = valueStr

    switch (setting.valueType) {
      case "boolean": {
        const truthy = ["true", "1", "on", "yes", "sim"]
        const falsy = ["false", "0", "off", "no", "não"]
        const lower = valueStr.toLowerCase()
        if (truthy.includes(lower)) {
          normalizedValue = "true"
        } else if (falsy.includes(lower)) {
          normalizedValue = "false"
        } else {
          throw new Error(`Valor invalido para ${setting.label}. Selecione Sim ou Nao.`)
        }
        break
      }
      case "number": {
        const parsed = Number(valueStr)
        if (Number.isNaN(parsed)) {
          throw new Error(`Valor numerico invalido em ${setting.label}.`)
        }
        normalizedValue = String(parsed)
        break
      }
      default: {
        normalizedValue = valueStr.trim()
        break
      }
    }

    await writeSettingValue(settingId, normalizedValue, actor.id, `Atualizado via ${redirectPath}`)
  }

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: "save_settings",
    entity: "SystemSetting",
    description: "Colecao de configuracoes atualizada.",
    details: JSON.stringify({ redirectPath, total: settingIds.length }),
  })

  revalidatePath("/configuracoes")
  revalidatePath(redirectPath)
}

export async function saveSequenceAction(formData: FormData) {
  const actor = await requireActor()
  const sequenceId = readString(formData, "sequenceId")

  const sequence = await prisma.documentSequence.update({
    where: { id: sequenceId },
    data: {
      prefix: readNullable(formData, "prefix"),
      nextNumber: Number(readString(formData, "nextNumber") || "1"),
      digits: Number(readString(formData, "digits") || "6"),
      resetMode: readString(formData, "resetMode") || "NEVER",
      status: readString(formData, "status") || "ACTIVE",
      notes: readNullable(formData, "notes"),
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: "edit",
    entity: "DocumentSequence",
    entityId: sequence.id,
    description: "Sequencia automatica atualizada.",
  })

  revalidatePath("/configuracoes/numeracao")
}

export async function savePrinterProfileAction(formData: FormData) {
  const actor = await requireActor()
  const profileId = readNullable(formData, "profileId")

  const data = {
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    driverName: readNullable(formData, "driverName"),
    paperWidth: readNullable(formData, "paperWidth"),
    isDefault: readBoolean(formData, "isDefault"),
    autoPrint: readBoolean(formData, "autoPrint"),
    headerTemplate: readNullable(formData, "headerTemplate"),
    footerTemplate: readNullable(formData, "footerTemplate"),
    documentTemplate: readNullable(formData, "documentTemplate"),
    notes: readNullable(formData, "notes"),
    status: readString(formData, "status") || "ACTIVE",
  }

  const printerProfile = profileId
    ? await prisma.printerProfile.update({
        where: { id: profileId },
        data,
      })
    : await prisma.printerProfile.create({
        data,
      })

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: profileId ? "edit" : "create",
    entity: "PrinterProfile",
    entityId: printerProfile.id,
    description: profileId ? "Perfil de impressora atualizado." : "Perfil de impressora criado.",
  })

  revalidatePath("/configuracoes/impressao")
}

export async function saveAutomationAction(formData: FormData) {
  const actor = await requireActor()
  const automationId = readString(formData, "automationId")

  const automation = await prisma.systemAutomation.update({
    where: { id: automationId },
    data: {
      name: readString(formData, "name"),
      category: readString(formData, "category"),
      description: readNullable(formData, "description"),
      frequency: readNullable(formData, "frequency"),
      notificationChannels: readNullable(formData, "notificationChannels"),
      config: readNullable(formData, "config"),
      isEnabled: readBoolean(formData, "isEnabled"),
      nextRunAt: readNullable(formData, "nextRunAt") ? new Date(readString(formData, "nextRunAt")) : null,
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: "edit",
    entity: "SystemAutomation",
    entityId: automation.id,
    description: "Automacao atualizada.",
  })

  revalidatePath("/configuracoes/automacoes")
}

async function resolveBackupFolder() {
  const folderSetting = await prisma.systemSetting.findUnique({
    where: { key: "backup.folder" },
  })

  return path.resolve(process.cwd(), folderSetting?.value || "backups")
}

async function createBackupRecord(backupType: string, userId: string) {
  const backupFolder = await resolveBackupFolder()
  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db")
  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")
  const fileName = `spa-do-colchao-${backupType.toLowerCase()}-${timestamp}.db`
  const filePath = path.join(backupFolder, fileName)

  await mkdir(backupFolder, { recursive: true })
  await copyFile(dbPath, filePath)

  const fileStats = await stat(filePath)

  return prisma.backupRecord.create({
    data: {
      label: `${backupType} ${timestamp}`,
      filePath,
      fileName,
      backupType,
      status: "COMPLETED",
      sizeBytes: Number(fileStats.size),
      createdById: userId,
    },
  })
}

export async function generateBackupNowAction() {
  const actor = await requireActor()
  const backupRecord = await createBackupRecord("MANUAL", actor.id)

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: "backup_now",
    entity: "BackupRecord",
    entityId: backupRecord.id,
    description: "Backup manual gerado.",
  })

  revalidatePath("/configuracoes")
  revalidatePath("/configuracoes/backup")
}

export async function exportDatabaseAction() {
  const actor = await requireActor()
  const backupRecord = await createBackupRecord("EXPORT", actor.id)

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: "export_database",
    entity: "BackupRecord",
    entityId: backupRecord.id,
    description: "Exportacao do banco gerada.",
  })

  revalidatePath("/configuracoes/backup")
}

export async function restoreBackupAction(formData: FormData) {
  const actor = await requireActor()
  const backupId = readString(formData, "backupId")
  const backupRecord = await prisma.backupRecord.findUnique({
    where: { id: backupId },
  })

  if (!backupRecord) {
    throw new Error("Backup não encontrado")
  }

  const dbPath = path.resolve(process.cwd(), "prisma", "dev.db")
  await prisma.$disconnect()
  await copyFile(backupRecord.filePath, dbPath)

  await prisma.backupRecord.update({
    where: { id: backupId },
    data: {
      restoredAt: new Date(),
      restoredById: actor.id,
      status: "RESTORED",
    },
  })

  await createAuditEntry({
    userId: actor.id,
    module: "Configuracoes",
    action: "restore_backup",
    entity: "BackupRecord",
    entityId: backupId,
    description: "Backup restaurado sobre o banco atual.",
  })

  revalidatePath("/configuracoes/backup")
}
