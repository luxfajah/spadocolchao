"use server"

import { prisma } from "@/lib/prisma"

export async function getRhDashboardData() {
  const [
    totalEmployees,
    activeEmployees,
    openJobs,
    activeCandidates,
    scheduledInterviews,
    disciplinaryActions,
    terminations
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.jobOpening.count({ where: { status: "OPEN" } }),
    prisma.candidate.count({ where: { status: { notIn: ["ARCHIVED", "REJECTED"] } } }),
    prisma.interviewSchedule.count({ where: { status: "SCHEDULED" } }),
    prisma.disciplinaryAction.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.terminationProcess.count({ where: { status: { not: "CANCELLED" } } })
  ])

  // Get recent hires (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentHires = await prisma.employee.count({
    where: {
      admissionDate: {
        gte: thirtyDaysAgo
      }
    }
  })

  // Get recent disciplinary actions (last 30 days)
  const recentDisciplinaryActions = await prisma.disciplinaryAction.count({
    where: {
      applicationDate: { gte: thirtyDaysAgo },
      status: { not: "CANCELLED" }
    }
  })

  // Get next interviews
  const nextInterviews = await prisma.interviewSchedule.findMany({
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
  })

  return {
    totalEmployees,
    activeEmployees,
    recentHires,
    openJobs,
    activeCandidates,
    scheduledInterviews,
    nextInterviews,
    disciplinaryActions,
    terminations,
    recentDisciplinaryActions
  }
}
