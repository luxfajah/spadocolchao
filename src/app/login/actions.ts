"use server"

import {
  authenticatedUserInclude,
  createSession,
  destroyCurrentSession,
  getAuthenticatedUser,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth"
import { getUserAccessProfile } from "@/lib/access-control"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function login(prevState: any, formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim()
  const normalizedIdentifier = normalizeEmail(identifier)
  const password = String(formData.get("password") ?? "")

  if (!identifier || !password) {
    return { error: "Preencha todos os campos" }
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { username: identifier }],
    },
  })

  if (!user) {
    return { error: "Credenciais invalidas" }
  }

  if (user.status === "BLOCKED") {
    return { error: "Usuario bloqueado. Contate o administrador do sistema." }
  }

  if (user.status === "INACTIVE") {
    return { error: "Usuario inativo. Solicite reativacao ao administrador." }
  }

  if (user.status === "PENDING_ACTIVATION") {
    return { error: "Usuario pendente de ativacao. Finalize o cadastro com o administrador." }
  }

  const passwordCheck = verifyPassword(password, user.passwordHash)

  if (!passwordCheck.valid) {
    const nextAttempts = user.failedLoginAttempts + 1
    const shouldBlock = nextAttempts >= 5

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldBlock ? 5 : nextAttempts,
        status: shouldBlock ? "BLOCKED" : user.status,
        blockedAt: shouldBlock ? new Date() : user.blockedAt,
        blockedReason: shouldBlock ? "Excesso de tentativas de autenticacao" : user.blockedReason,
      },
    })

    return {
      error: shouldBlock
        ? "Acesso bloqueado apos multiplas tentativas. Contate o administrador."
        : "Credenciais invalidas",
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: passwordCheck.needsRehash ? hashPassword(password) : user.passwordHash,
      failedLoginAttempts: 0,
      blockedAt: null,
      blockedReason: null,
      lastLoginAt: new Date(),
      lastLoginIp: null,
      lastLoginUserAgent: null,
    },
  })

  await createSession(user.id)
  const authenticatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: authenticatedUserInclude,
  })

  if (!authenticatedUser) {
    redirect("/dashboard")
  }

  const accessProfile = await getUserAccessProfile(authenticatedUser)
  redirect(accessProfile.defaultRoute)
}

export async function logout() {
  await destroyCurrentSession()
  redirect("/login")
}

export async function getUser() {
  return getAuthenticatedUser()
}
