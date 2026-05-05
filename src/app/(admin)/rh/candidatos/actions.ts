"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCandidates(q: string = "") {
  return await prisma.candidate.findMany({
    where: {
      OR: [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { positionOfInterest: { contains: q } }
      ]
    },
    include: {
      tags: true,
      applications: {
        include: { jobOpening: true },
        orderBy: { applicationDate: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function moveCandidateToTalentPool(candidateId: string, notes: string = "") {
  // Update candidate status
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: "TALENT_POOL" }
  })

  // Create Talent Pool Entry if it doesn't exist
  await prisma.talentPoolEntry.upsert({
    where: { candidateId },
    create: {
      candidateId,
      notes,
    },
    update: {
      notes: notes,
      lastInteraction: new Date()
    }
  })

  // Also close active applications for this candidate if they were rejected
  await prisma.candidateApplication.updateMany({
    where: { candidateId, status: { notIn: ["HIRED", "REJECTED"] } },
    data: { status: "REJECTED" }
  })

  revalidatePath("/rh/candidatos")
  revalidatePath("/rh/vagas")
}
