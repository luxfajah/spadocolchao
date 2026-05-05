import "server-only"

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

const SESSION_COOKIE_NAME = "spa_session"
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12
const SESSION_TOUCH_WINDOW_MS = 1000 * 60 * 5
const PASSWORD_PREFIX = "scrypt"

export const authenticatedUserInclude = {
  primaryRole: true,
  roles: {
    include: {
      role: true,
    },
  },
  permissionOverrides: {
    include: {
      permission: true,
    },
  },
} as const

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${PASSWORD_PREFIX}$${salt}$${hash}`
}

export function verifyPassword(password: string, storedPasswordHash: string) {
  if (!storedPasswordHash.startsWith(`${PASSWORD_PREFIX}$`)) {
    const isLegacyMatch = storedPasswordHash === password
    return {
      valid: isLegacyMatch,
      needsRehash: isLegacyMatch,
    }
  }

  const [, salt, storedHash] = storedPasswordHash.split("$")
  if (!salt || !storedHash) {
    return { valid: false, needsRehash: false }
  }

  const computedHash = scryptSync(password, salt, 64).toString("hex")
  const storedBuffer = Buffer.from(storedHash, "hex")
  const computedBuffer = Buffer.from(computedHash, "hex")

  if (storedBuffer.length !== computedBuffer.length) {
    return { valid: false, needsRehash: false }
  }

  return {
    valid: timingSafeEqual(storedBuffer, computedBuffer),
    needsRehash: false,
  }
}

function getClientMetadata() {
  const headerStore = headers()
  const forwardedFor = headerStore.get("x-forwarded-for")

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null,
    userAgent: headerStore.get("user-agent") || null,
  }
}

function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })
}

function clearSessionCookie() {
  cookies().set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(48).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const metadata = getClientMetadata()

  await prisma.userSession.create({
    data: {
      userId,
      sessionToken: hashValue(rawToken),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      isActive: true,
    },
  })

  setSessionCookie(rawToken, expiresAt)
}

async function getSessionRecord() {
  const rawToken = cookies().get(SESSION_COOKIE_NAME)?.value
  if (!rawToken) {
    return null
  }

  return prisma.userSession.findFirst({
    where: {
      sessionToken: hashValue(rawToken),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      user: {
        include: authenticatedUserInclude,
      },
    },
  })
}

async function touchSessionActivity(sessionId: string, lastActivityAt: Date) {
  if (Date.now() - lastActivityAt.getTime() < SESSION_TOUCH_WINDOW_MS) {
    return
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: {
      lastActivityAt: new Date(),
    },
  })
}

export async function getAuthenticatedSession() {
  const session = await getSessionRecord()
  if (!session || !session.user || session.user.status !== "ACTIVE") {
    return null
  }

  await touchSessionActivity(session.id, session.lastActivityAt)
  return session
}

export async function getAuthenticatedUser() {
  const session = await getAuthenticatedSession()
  return session?.user ?? null
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login")
  }

  return user
}

export async function destroyCurrentSession(reason = "LOGOUT") {
  const rawToken = cookies().get(SESSION_COOKIE_NAME)?.value
  if (rawToken) {
    await prisma.userSession.updateMany({
      where: {
        sessionToken: hashValue(rawToken),
        isActive: true,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
        endReason: reason,
      },
    })
  }

  clearSessionCookie()
}

export async function destroySessionById(sessionId: string, reason = "FORCED_LOGOUT") {
  await prisma.userSession.updateMany({
    where: {
      id: sessionId,
      isActive: true,
    },
    data: {
      isActive: false,
      endedAt: new Date(),
      endReason: reason,
    },
  })
}

export async function destroyUserSessions(userId: string, reason = "FORCED_LOGOUT_ALL") {
  await prisma.userSession.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
      endedAt: new Date(),
      endReason: reason,
    },
  })
}
