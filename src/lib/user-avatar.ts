import "server-only"

import { prisma } from "@/lib/prisma"

export const USER_AVATAR_ENTITY = "USER_AVATAR"

export async function getUserAvatarUrl(userId: string) {
  const avatarAttachment = await prisma.fileAttachment.findFirst({
    where: {
      entityName: USER_AVATAR_ENTITY,
      entityId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      filePath: true,
    },
  })

  return avatarAttachment?.filePath || null
}
