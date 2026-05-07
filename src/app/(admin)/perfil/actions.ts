"use server"

import { randomUUID } from "crypto"
import { uploadFile } from "@/lib/storage-service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getAuthenticatedUser, hashPassword, normalizeEmail, verifyPassword } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { USER_AVATAR_ENTITY } from "@/lib/user-avatar"

export interface UpdateOwnProfileState {
  error: string | null
}

export interface ChangeOwnPasswordState {
  error: string | null
  success: string | null
}

const MAX_PROFILE_PHOTO_SIZE_BYTES = 5 * 1024 * 1024
const profilePhotoMimeExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function readNullable(formData: FormData, key: string) {
  const value = readString(formData, key)
  return value || null
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function createAuditEntry(input: {
  userId: string
  action: string
  description: string
  details?: string | null
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      module: "Perfil",
      action: input.action,
      entity: "User",
      entityId: input.userId,
      description: input.description,
      details: input.details,
      origin: "PERFIL",
      ipAddress: null,
      userAgent: null,
    },
  })
}

async function saveProfilePhoto(userId: string, photoFile: File) {
  if (photoFile.size <= 0 || !photoFile.name) {
    return { avatarUrl: null as string | null, error: null as string | null }
  }

  const mimeType = (photoFile.type || "").toLowerCase()
  const fallbackExtension = extname(photoFile.name).toLowerCase()
  const extension = profilePhotoMimeExtensions[mimeType] || fallbackExtension

  if (!profilePhotoMimeExtensions[mimeType]) {
    return {
      avatarUrl: null,
      error: "Formato de foto inválido. Use JPG, PNG ou WEBP.",
    }
  }

  if (photoFile.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
    return {
      avatarUrl: null,
      error: "A foto deve ter no máximo 5 MB.",
    }
  }

  const safeExtension = /^[.][a-z0-9]+$/.test(extension) ? extension : ".jpg"
  const storedName = `avatar-${userId}-${Date.now()}-${randomUUID()}${safeExtension}`
  const storagePath = `avatars/${storedName}`
  const fileBuffer = Buffer.from(await photoFile.arrayBuffer())

  const avatarUrl = await uploadFile(storagePath, fileBuffer, mimeType)

  await prisma.fileAttachment.create({
    data: {
      originalName: photoFile.name,
      storedName,
      mimeType: mimeType || "image/jpeg",
      extension: safeExtension,
      filePath: avatarUrl,
      fileSize: fileBuffer.byteLength,
      entityName: USER_AVATAR_ENTITY,
      entityId: userId,
      uploadedById: userId,
    },
  })

  return { avatarUrl, error: null as string | null }
}

export async function updateOwnProfileAction(
  _prevState: UpdateOwnProfileState,
  formData: FormData,
): Promise<UpdateOwnProfileState> {
  const actor = await getAuthenticatedUser()

  if (!actor) {
    return {
      error: "Sua sessão expirou. Entre novamente para editar o perfil.",
    }
  }

  const name = readString(formData, "name")
  const socialName = readNullable(formData, "socialName")
  const emailInput = readString(formData, "email")
  const email = emailInput ? normalizeEmail(emailInput) : null
  const phone = readNullable(formData, "phone")
  const profilePhoto = formData.get("profilePhoto")

  if (!name) {
    return {
      error: "Informe seu nome para salvar as alterações.",
    }
  }

  if (email && !isValidEmail(email)) {
    return {
      error: "Informe um e-mail válido.",
    }
  }

  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: {
          not: actor.id,
        },
      },
      select: {
        id: true,
      },
    })

    if (existingUser) {
      return {
        error: "Este e-mail já está em uso por outro usuário.",
      }
    }
  }

  let photoUpdated = false

  if (profilePhoto instanceof File && profilePhoto.size > 0) {
    const photoResult = await saveProfilePhoto(actor.id, profilePhoto)

    if (photoResult.error) {
      return {
        error: photoResult.error,
      }
    }

    photoUpdated = Boolean(photoResult.avatarUrl)
  }

  await prisma.user.update({
    where: {
      id: actor.id,
    },
    data: {
      name,
      socialName,
      email,
      phone,
    },
  })

  await createAuditEntry({
    userId: actor.id,
    action: "edit_self",
    description: "Usuário atualizou o próprio perfil.",
    details: JSON.stringify({
      name,
      socialName,
      email,
      phone,
      photoUpdated,
    }),
  })

  revalidatePath("/perfil")
  revalidatePath("/perfil/editar")
  revalidatePath("/", "layout")
  redirect("/perfil")
}

export async function changeOwnPasswordAction(
  _prevState: ChangeOwnPasswordState,
  formData: FormData,
): Promise<ChangeOwnPasswordState> {
  const actor = await getAuthenticatedUser()

  if (!actor) {
    return {
      error: "Sua sessão expirou. Entre novamente para alterar a senha.",
      success: null,
    }
  }

  const currentPassword = readString(formData, "currentPassword")
  const newPassword = readString(formData, "newPassword")
  const confirmNewPassword = readString(formData, "confirmNewPassword")

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return {
      error: "Preencha senha atual, nova senha e confirmação.",
      success: null,
    }
  }

  if (newPassword.length < 8) {
    return {
      error: "A nova senha precisa ter ao menos 8 caracteres.",
      success: null,
    }
  }

  if (newPassword !== confirmNewPassword) {
    return {
      error: "A confirmação da nova senha não confere.",
      success: null,
    }
  }

  if (currentPassword === newPassword) {
    return {
      error: "A nova senha deve ser diferente da senha atual.",
      success: null,
    }
  }

  const account = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true },
  })

  if (!account) {
    return {
      error: "Não foi possível localizar sua conta.",
      success: null,
    }
  }

  const passwordCheck = verifyPassword(currentPassword, account.passwordHash)

  if (!passwordCheck.valid) {
    return {
      error: "A senha atual informada está incorreta.",
      success: null,
    }
  }

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      failedLoginAttempts: 0,
      blockedAt: null,
      blockedReason: null,
    },
  })

  await createAuditEntry({
    userId: actor.id,
    action: "change_password_self",
    description: "Usuário alterou a própria senha com validação da senha atual.",
  })

  revalidatePath("/perfil")
  revalidatePath("/perfil/editar")

  return {
    error: null,
    success: "Senha alterada com sucesso.",
  }
}
