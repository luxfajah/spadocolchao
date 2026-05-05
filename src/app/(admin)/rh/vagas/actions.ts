"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getJobOpenings(q: string = "") {
  return await prisma.jobOpening.findMany({
    where: {
      title: { contains: q }
    },
    include: {
      jobTitle: {
        select: {
          id: true,
          name: true,
          department: true,
          shiftName: true,
        },
      },
      _count: {
        select: { applications: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function getJobDetails(id: string) {
  return await prisma.jobOpening.findUnique({
    where: { id },
    include: {
      jobTitle: {
        select: {
          id: true,
          name: true,
          department: true,
          shiftName: true,
          defaultSalary: true,
          costCenter: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      applications: {
        include: { candidate: { include: { tags: true } } },
        orderBy: { applicationDate: "desc" }
      },
      interviews: {
        include: { candidate: true, interviewer: true }
      }
    }
  })
}
