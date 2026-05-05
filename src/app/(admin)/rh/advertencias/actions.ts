"use server"

import { prisma } from "@/lib/prisma"

export async function getDisciplinaryActions(q: string = "") {
  return await prisma.disciplinaryAction.findMany({
    where: {
      OR: [
        { employee: { fullName: { contains: q } } },
        { employee: { socialName: { contains: q } } },
        { reason: { contains: q } }
      ]
    },
    include: {
      employee: {
        include: { jobTitle: true }
      },
      responsible: true
    },
    orderBy: { incidentDate: "desc" }
  })
}
