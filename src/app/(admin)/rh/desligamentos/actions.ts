"use server"

import { prisma } from "@/lib/prisma"
import { getEmployeePrimaryName } from "@/lib/employee-name"
import { revalidatePath } from "next/cache"

export async function getTerminations(q: string = "") {
  return await prisma.terminationProcess.findMany({
    where: {
      OR: [
        { employee: { fullName: { contains: q } } },
        { employee: { socialName: { contains: q } } },
        { reason: { contains: q } }
      ]
    },
    include: {
      employee: {
        include: { jobTitle: true, costCenter: true }
      },
      responsible: true
    },
    orderBy: { terminationDate: "desc" }
  })
}

export async function startTerminationProcess(employeeId: string, data: {
  type: string
  noticeDate?: Date
  terminationDate: Date
  reason?: string
}) {
  const termination = await prisma.terminationProcess.create({
    data: {
      employeeId,
      type: data.type,
      noticeDate: data.noticeDate,
      terminationDate: data.terminationDate,
      reason: data.reason,
      status: "STARTED"
    }
  })

  // Freeze the employee status to SUSPENDED to prevent generic changes and payroll processing
  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "SUSPENDED" }
  })

  revalidatePath("/rh/desligamentos")
  revalidatePath(`/rh/funcionarios/${employeeId}`)

  return termination
}

export async function sendTerminationToFinance(terminationId: string, amount: number, dueDate: Date) {
  const termination = await prisma.terminationProcess.findUnique({
    where: { id: terminationId },
    include: { employee: true }
  })

  if (!termination) throw new Error("Processo de desligamento não encontrado")

  // Create an Account Payable for the Rescission
  const payable = await prisma.accountPayable.create({
    data: {
      description: `Rescisão Contratual - ${getEmployeePrimaryName(termination.employee)}`,
      dueDate: dueDate,
      amount: amount,
      status: "PENDING",
      notes: `Vínculo com Desligamento ID: ${termination.id}`
    }
  })

  // Mark the Termination checklist item as true
  await prisma.terminationProcess.update({
    where: { id: terminationId },
    data: { financialSent: true }
  })

  revalidatePath("/rh/desligamentos")
  return payable
}
