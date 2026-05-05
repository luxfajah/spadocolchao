"use server"

import { prisma } from "@/lib/prisma"

export async function getRecruitmentDashboardData() {
  const [
    openJobs,
    totalCandidates,
    talentPoolCount,
    scheduledInterviews,
    recentApplications
  ] = await Promise.all([
    prisma.jobOpening.findMany({
      where: { status: "OPEN" },
      include: { _count: { select: { applications: true } } },
      take: 5,
      orderBy: { createdAt: "desc" }
    }),
    prisma.candidate.count(),
    prisma.talentPoolEntry.count(),
    prisma.interviewSchedule.findMany({
      where: { 
        status: "SCHEDULED",
        scheduledDate: { gte: new Date() }
      },
      include: {
        candidate: true,
        jobOpening: true
      },
      orderBy: { scheduledDate: "asc" },
      take: 5
    }),
    prisma.candidateApplication.findMany({
      take: 5,
      orderBy: { applicationDate: "desc" },
      include: {
        candidate: true,
        jobOpening: true
      }
    })
  ])

  const stats = {
    openJobsCount: await prisma.jobOpening.count({ where: { status: "OPEN" } }),
    totalCandidates,
    talentPoolCount,
    interviewsScheduledCount: await prisma.interviewSchedule.count({ where: { status: "SCHEDULED" } })
  }

  return {
    openJobs,
    stats,
    scheduledInterviews,
    recentApplications
  }
}
