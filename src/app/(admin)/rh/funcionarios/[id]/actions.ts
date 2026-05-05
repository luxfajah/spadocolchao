"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { attachAttendanceMirrors } from "@/lib/payroll/attendance-mirror"

export async function getEmployeeDetails(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      jobTitle: true,
      workSchedule: true,
      costCenter: true,
      documents: {
        orderBy: { createdAt: "desc" }
      },
      notesHistory: {
        include: { createdBy: true },
        orderBy: { createdAt: "desc" }
      },
      vacations: {
        orderBy: { periodStart: "desc" }
      },
      interviews: {
        include: { candidate: true, jobOpening: true },
        orderBy: { scheduledDate: "desc" }
      },
      disciplinaryActions: {
        include: { responsible: true },
        orderBy: { incidentDate: "desc" }
      },
      terminations: true,
      payrolls: {
        orderBy: [{ referencePeriod: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          employeeId: true,
          referencePeriod: true,
          grossSalary: true,
          netSalary: true,
          otherAdditions: true,
          otherDeductions: true,
          inss: true,
          irrf: true,
          status: true,
          createdAt: true,
          notes: true,
        },
      },
      attendanceMirrors: {
        orderBy: [{ period: "desc" }, { createdAt: "desc" }],
      }
    }
  })

  if (!employee) {
    return employee
  }

  const payrolls = await attachAttendanceMirrors(employee.payrolls)

  return {
    ...employee,
    payrolls,
  }
}

export async function addEmployeeDocument(employeeId: string, data: {
  type: string
  name: string
  description?: string
  fileUrl: string
}) {
  await prisma.employeeDocument.create({
    data: {
      employeeId,
      ...data
    }
  })

  revalidatePath(`/rh/funcionarios/${employeeId}`)
}
