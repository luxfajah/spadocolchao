"use server"

import { prisma } from "@/lib/prisma"

export async function getInterviews(q: string = "") {
  return await prisma.interviewSchedule.findMany({
    where: {
      OR: [
        { candidate: { fullName: { contains: q } } },
        { jobOpening: { title: { contains: q } } },
        { interviewer: { fullName: { contains: q } } },
        { interviewer: { socialName: { contains: q } } }
      ]
    },
    include: {
      candidate: true,
      jobOpening: true,
      interviewer: true
    },
    orderBy: { scheduledDate: "asc" }
  })
}
