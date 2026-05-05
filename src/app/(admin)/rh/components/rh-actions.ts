"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createJobOpening(data: {
  jobTitleId: string
  department?: string
  contractType: string
  workModel: string
  description: string
  salaryRange?: string
}) {
  if (!data.jobTitleId) {
    throw new Error("Selecione um cargo para abrir a vaga.")
  }

  const jobTitle = await prisma.jobTitle.findUnique({
    where: { id: data.jobTitleId },
    select: {
      id: true,
      name: true,
      department: true,
      defaultSalary: true,
      isActive: true,
    },
  })

  if (!jobTitle?.isActive) {
    throw new Error("Selecione um cargo valido para a vaga.")
  }

  const job = await prisma.jobOpening.create({
    data: {
      title: jobTitle.name,
      role: jobTitle.name,
      jobTitleId: jobTitle.id,
      department: data.department || jobTitle.department || null,
      contractType: data.contractType,
      workModel: data.workModel,
      description: data.description || "",
      salaryRange:
        data.salaryRange ||
        (jobTitle.defaultSalary !== null && jobTitle.defaultSalary !== undefined
          ? new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(jobTitle.defaultSalary)
          : null),
      status: "OPEN",
      openingDate: new Date(),
    }
  })
  revalidatePath("/rh/vagas")
  return job
}

export async function createCandidate(data: {
  fullName: string
  email?: string
  phone?: string
  positionOfInterest?: string
  resumeUrl?: string
  notes?: string
}) {
  const candidate = await prisma.candidate.create({
    data: {
      fullName: data.fullName,
      email: data.email || null,
      phone: data.phone || null,
      positionOfInterest: data.positionOfInterest || null,
      resumeUrl: data.resumeUrl || null,
      notes: data.notes || null,
      status: "NEW",
    }
  })
  revalidatePath("/rh/candidatos")
  return candidate
}

export async function scheduleInterview(data: {
  candidateId: string
  jobOpeningId?: string
  scheduledDate: string
  startTime: string
  endTime: string
  stage: string
  locationOrLink?: string
  notes?: string
}) {
  const scheduledDate = new Date(data.scheduledDate)
  const startTime = new Date(`${data.scheduledDate}T${data.startTime}:00`)
  const endTime = new Date(`${data.scheduledDate}T${data.endTime}:00`)
  
  const interview = await prisma.interviewSchedule.create({
    data: {
      candidateId: data.candidateId,
      jobOpeningId: data.jobOpeningId || null,
      scheduledDate,
      startTime,
      endTime,
      stage: data.stage,
      locationOrLink: data.locationOrLink || "Spa do Colchão — RH",
      status: "SCHEDULED",
      notes: data.notes || null,
    }
  })
  revalidatePath("/rh/entrevistas")
  return interview
}

export async function createDisciplinaryAction(data: {
  employeeId: string
  type: string
  reason: string
  description?: string
  incidentDate: string
  applicationDate: string
  attachmentUrl?: string
}) {
  const action = await (prisma as any).disciplinaryAction.create({
    data: {
      employeeId: data.employeeId,
      type: data.type,
      reason: data.reason,
      description: data.description || null,
      incidentDate: new Date(data.incidentDate),
      applicationDate: new Date(data.applicationDate),
      attachmentUrl: data.attachmentUrl || null,
      employeeAwareness: false,
    }
  })
  revalidatePath("/rh/advertencias")
  return action
}

export async function startTerminationFromList(data: {
  employeeId: string
  reason: string
  type: string
  terminationDate: string
  notes?: string
  attachmentUrl?: string
}) {
  const [termination] = await (prisma as any).$transaction([
    (prisma as any).terminationProcess.create({
      data: {
        employeeId: data.employeeId,
        reason: data.reason,
        type: data.type,
        terminationDate: new Date(data.terminationDate),
        notes: data.notes || null,
        attachmentUrl: data.attachmentUrl || null,
      }
    }),
    prisma.employee.update({
      where: { id: data.employeeId },
      data: { status: "INACTIVE" }
    })
  ])
  revalidatePath("/rh/desligamentos")
  revalidatePath("/rh/funcionarios")
  return termination
}

export async function getActiveEmployees() {
  return prisma.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, fullName: true, socialName: true },
    orderBy: { fullName: "asc" }
  })
}

export async function getAllCandidates() {
  return prisma.candidate.findMany({
    select: { id: true, fullName: true, positionOfInterest: true },
    orderBy: { fullName: "asc" }
  })
}

export async function getAllJobOpenings() {
  return prisma.jobOpening.findMany({
    where: { status: { in: ["OPEN", "SCREENING", "INTERVIEWS"] } },
    select: { id: true, title: true },
    orderBy: { title: "asc" }
  })
}
