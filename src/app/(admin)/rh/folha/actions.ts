"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { getEmployeePrimaryName } from "@/lib/employee-name"
import {
  attachAttendanceMirrors,
  buildAttendanceMirrorNote,
} from "@/lib/payroll/attendance-mirror"
import {
  buildPayrollAllocationNote,
  buildPayrollPayableDescription,
  buildPayrollPayableNotes,
  extractPayrollAllocationSnapshot,
  resolveEmployeePayrollAllocation,
} from "@/lib/payroll/allocation"
import {
  calculatePayrollBenefitBreakdown,
  calculatePayrollValuesByPeriod,
} from "@/lib/payroll/tax-policy"
import { resolveUnifiedCostClassification } from "@/lib/finance/unified-cost-classification"
import { generateOfficialPayrollPdf } from "@/lib/payroll/official-payroll-pdf"

type PayrollCalculationInput = {
  fullName: string
  socialName?: string | null
  salaryBase: number | null
  vtDailyValue?: number | null
  vtWorkDaysPerMonth?: number | null
  transportationAllowance: number | null
  transportationPayrollDeductionEnabled?: boolean | null
  transportationPayrollDeductionPercent?: number | null
  foodAllowance: number | null
  foodPayrollDeductionEnabled?: boolean | null
  foodPayrollDeductionPercent?: number | null
  fuelAllowance?: number | null
}

function resolvePayrollPeriod(period?: string) {
  return period || new Date().toISOString().slice(0, 7)
}

function resolvePayrollDueDate(period: string) {
  const [yearPart, monthPart] = period.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Competência inválida para geração de holerite.")
  }

  return new Date(year, month, 5)
}

function calculatePayrollValues(employee: PayrollCalculationInput, period: string, mirror?: { overtimeMinutes: number; deficitMinutes: number } | null) {
  if (!employee.salaryBase || employee.salaryBase <= 0) {
    throw new Error(`O funcionário ${getEmployeePrimaryName(employee)} não possui salário base configurado.`)
  }

  let overtimeAddition = 0
  if (mirror && mirror.overtimeMinutes > 0 && employee.salaryBase) {
    const hourlyRate = employee.salaryBase / 220
    const overtimeRate = hourlyRate * 1.5
    overtimeAddition = (mirror.overtimeMinutes / 60) * overtimeRate
  }

  const benefitBreakdown = calculatePayrollBenefitBreakdown({
    salaryBase: employee.salaryBase,
    transportationAllowance: employee.transportationAllowance,
    transportationPayrollDeductionEnabled: employee.transportationPayrollDeductionEnabled,
    transportationPayrollDeductionPercent: employee.transportationPayrollDeductionPercent,
    foodAllowance: employee.foodAllowance,
    foodPayrollDeductionEnabled: employee.foodPayrollDeductionEnabled,
    foodPayrollDeductionPercent: employee.foodPayrollDeductionPercent,
    fuelAllowance: employee.fuelAllowance,
  })

  return calculatePayrollValuesByPeriod({
    period,
    grossSalary: employee.salaryBase,
    otherAdditions: benefitBreakdown.totalAdditions + overtimeAddition,
    otherDeductions: benefitBreakdown.totalDeductions,
  })
}

async function getApprovedMirror(employeeId: string, period: string, attendanceMirrorId?: string) {
  const where = attendanceMirrorId
    ? { id: attendanceMirrorId, employeeId }
    : { employeeId, period }

  const mirror = await prisma.attendanceMirror.findFirst({
    where,
  })

  if (!mirror) {
    throw new Error("Nenhum espelho encontrado para este funcionário e período.")
  }

  if (mirror.status !== "APPROVED") {
    throw new Error("Confirme o espelho de ponto tratado antes de gerar o holerite.")
  }

  return mirror
}

function resolvePayrollAllocationSnapshot(payroll: {
  notes?: string | null
  employee: {
    department?: string | null
    costCenter?: {
      name?: string | null
    } | null
    jobTitle?: {
      department?: string | null
    } | null
  }
}) {
  const storedSnapshot = extractPayrollAllocationSnapshot(payroll)
  const employeeSnapshot = resolveEmployeePayrollAllocation(payroll.employee)

  return {
    costCenterName: storedSnapshot.costCenterName || employeeSnapshot.costCenterName,
    sectorName: storedSnapshot.sectorName || employeeSnapshot.sectorName,
  }
}

export async function getPayrolls(period?: string, employeeId?: string) {
  const currentPeriod = resolvePayrollPeriod(period)

  const payrolls = await prisma.payroll.findMany({
    where: {
      referencePeriod: currentPeriod,
      ...(employeeId ? { employeeId } : {}),
    },
    select: {
      id: true,
      employeeId: true,
      attendanceMirrorId: true,
      referencePeriod: true,
      netSalary: true,
      inss: true,
      fgts: true,
      irrf: true,
      otherDeductions: true,
      otherAdditions: true,
      grossSalary: true,
      status: true,
      notes: true,
      createdAt: true,
      employee: {
        select: {
          id: true,
          fullName: true,
          socialName: true,
          department: true,
      jobTitle: {
        select: {
          name: true,
          costCenterId: true,
          costCenter: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
          department: true,
        },
      },
          costCenter: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const payrollsWithMirrors = await attachAttendanceMirrors(payrolls)

  return payrollsWithMirrors.map((payroll) => ({
    ...payroll,
    allocationSnapshot: resolvePayrollAllocationSnapshot(payroll),
  }))
}

export async function generatePayrollForEmployee(
  employeeId: string,
  period: string,
  data: {
    grossSalary: number
    inss: number
    fgts: number
    irrf: number
    otherDeductions: number
    otherAdditions: number
  },
  attendanceMirrorId?: string
) {
  const mirror = attendanceMirrorId
    ? await getApprovedMirror(employeeId, resolvePayrollPeriod(period), attendanceMirrorId)
    : null
  const normalizedPeriod = mirror?.period || resolvePayrollPeriod(period)
  const netSalary =
    data.grossSalary - data.inss - data.irrf - data.otherDeductions + data.otherAdditions
  const dueDate = resolvePayrollDueDate(normalizedPeriod)
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      fullName: true,
      socialName: true,
      department: true,
      costCenterId: true,
      costCenter: {
        select: {
          name: true,
        },
      },
      jobTitle: {
        select: {
          costCenterId: true,
          costCenter: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
          department: true,
        },
      },
    },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado para gerar o holerite.")
  }

  const employeeDisplayName = getEmployeePrimaryName(employee)
  const unifiedClassification = await resolveUnifiedCostClassification(employee)
  const allocationSnapshot = {
    costCenterName: unifiedClassification.costCenterName,
    sectorName: unifiedClassification.sectorName,
  }
  const payrollNotes = buildPayrollAllocationNote(
    allocationSnapshot,
    mirror ? buildAttendanceMirrorNote(mirror.id) : undefined
  )

  const payroll = await prisma.payroll.create({
    data: {
      employeeId,
      referencePeriod: normalizedPeriod,
      grossSalary: data.grossSalary,
      netSalary,
      inss: data.inss,
      fgts: data.fgts,
      irrf: data.irrf,
      otherDeductions: data.otherDeductions,
      otherAdditions: data.otherAdditions,
      status: "GENERATED",
      notes: payrollNotes || undefined,
    },
  })

  await prisma.accountPayable.create({
    data: {
      description: buildPayrollPayableDescription(employeeDisplayName, allocationSnapshot),
      amount: netSalary,
      dueDate,
      payrollId: payroll.id,
      costCenterId: unifiedClassification.costCenterId || undefined,
      financialCategoryId: unifiedClassification.financialCategoryId || undefined,
      notes: buildPayrollPayableNotes(normalizedPeriod, mirror?.id, allocationSnapshot),
      status: "PENDING",
    },
  })

  revalidatePath("/rh/folha")
  return payroll
}

export async function generateEmployeePayroll(
  employeeId: string,
  period: string,
  attendanceMirrorId?: string
) {
  const normalizedPeriod = resolvePayrollPeriod(period)
  const approvedMirror = await getApprovedMirror(employeeId, normalizedPeriod, attendanceMirrorId)
  const dueDate = resolvePayrollDueDate(approvedMirror.period)

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      fullName: true,
      socialName: true,
      department: true,
      salaryBase: true,
      vtDailyValue: true,
      vtWorkDaysPerMonth: true,
      transportationAllowance: true,
      transportationPayrollDeductionEnabled: true,
      transportationPayrollDeductionPercent: true,
      foodAllowance: true,
      foodPayrollDeductionEnabled: true,
      foodPayrollDeductionPercent: true,
      fuelAllowance: true,
      costCenterId: true,
      costCenter: {
        select: {
          name: true,
        },
      },
      jobTitle: {
        select: {
          costCenterId: true,
          costCenter: {
            select: {
              id: true,
              code: true,
              name: true,
              isActive: true,
            },
          },
          department: true,
        },
      },
    },
  })

  if (!employee) {
    throw new Error("Funcionário não encontrado para gerar o holerite.")
  }

  const payrollValues = calculatePayrollValues(employee, approvedMirror.period, approvedMirror)
  const employeeDisplayName = getEmployeePrimaryName(employee)
  const unifiedClassification = await resolveUnifiedCostClassification(employee)
  const allocationSnapshot = {
    costCenterName: unifiedClassification.costCenterName,
    sectorName: unifiedClassification.sectorName,
  }
  const payableDescription = buildPayrollPayableDescription(employeeDisplayName, allocationSnapshot)
  const payableNotes = buildPayrollPayableNotes(
    approvedMirror.period,
    approvedMirror.id,
    allocationSnapshot
  )

  const result = await prisma.$transaction(async (tx) => {
    const existingPayroll = await tx.payroll.findFirst({
      where: {
        employeeId,
        referencePeriod: approvedMirror.period,
      },
      include: {
        accountsPayable: {
          select: { id: true },
          take: 1,
        },
      },
    })

    if (existingPayroll) {
      const updatedPayrollNotes = buildPayrollAllocationNote(
        allocationSnapshot,
        buildAttendanceMirrorNote(approvedMirror.id, existingPayroll.notes)
      )
      const payrollNeedsRefresh =
        existingPayroll.grossSalary !== payrollValues.grossSalary ||
        existingPayroll.netSalary !== payrollValues.netSalary ||
        existingPayroll.inss !== payrollValues.inss ||
        existingPayroll.fgts !== payrollValues.fgts ||
        existingPayroll.irrf !== payrollValues.irrf ||
        existingPayroll.otherDeductions !== payrollValues.otherDeductions ||
        existingPayroll.otherAdditions !== payrollValues.otherAdditions ||
        updatedPayrollNotes !== (existingPayroll.notes || "")

      if (payrollNeedsRefresh) {
        await tx.payroll.update({
          where: { id: existingPayroll.id },
          data: {
            grossSalary: payrollValues.grossSalary,
            netSalary: payrollValues.netSalary,
            inss: payrollValues.inss,
            fgts: payrollValues.fgts,
            irrf: payrollValues.irrf,
            otherDeductions: payrollValues.otherDeductions,
            otherAdditions: payrollValues.otherAdditions,
            notes: updatedPayrollNotes,
          },
        })
      }

      if (existingPayroll.accountsPayable.length === 0) {
        await tx.accountPayable.create({
          data: {
            description: payableDescription,
            amount: payrollValues.netSalary,
            dueDate,
            payrollId: existingPayroll.id,
            costCenterId: unifiedClassification.costCenterId || undefined,
            financialCategoryId: unifiedClassification.financialCategoryId || undefined,
            notes: payableNotes,
            status: "PENDING",
          },
        })
      } else {
        await tx.accountPayable.updateMany({
          where: {
            payrollId: existingPayroll.id,
          },
          data: {
            description: payableDescription,
            amount: payrollValues.netSalary,
            dueDate,
            costCenterId: unifiedClassification.costCenterId || null,
            financialCategoryId: unifiedClassification.financialCategoryId || null,
            notes: payableNotes,
          },
        })
      }

      return {
        payrollId: existingPayroll.id,
        created: false,
      }
    }

    const payroll = await tx.payroll.create({
      data: {
        employeeId,
        referencePeriod: approvedMirror.period,
        grossSalary: payrollValues.grossSalary,
        netSalary: payrollValues.netSalary,
        inss: payrollValues.inss,
        fgts: payrollValues.fgts,
        irrf: payrollValues.irrf,
        otherDeductions: payrollValues.otherDeductions,
        otherAdditions: payrollValues.otherAdditions,
        status: "GENERATED",
        notes: buildPayrollAllocationNote(
          allocationSnapshot,
          buildAttendanceMirrorNote(approvedMirror.id)
        ),
      },
    })

    await tx.accountPayable.create({
      data: {
        description: payableDescription,
        amount: payrollValues.netSalary,
        dueDate,
        payrollId: payroll.id,
        costCenterId: unifiedClassification.costCenterId || undefined,
        financialCategoryId: unifiedClassification.financialCategoryId || undefined,
        notes: payableNotes,
        status: "PENDING",
      },
    })

    return {
      payrollId: payroll.id,
      created: true,
    }
  })

  revalidatePath("/rh/folha")
  revalidatePath(`/rh/funcionarios/${employeeId}`)
  revalidatePath(`/rh/ponto/${employeeId}`)
  revalidatePath(`/rh/ponto/espelho/${approvedMirror.id}`)

  return {
    ...result,
    period: approvedMirror.period,
    mirrorId: approvedMirror.id,
  }
}

export async function generateBatchPayroll(period: string) {
  const normalizedPeriod = resolvePayrollPeriod(period)
  const dueDate = resolvePayrollDueDate(normalizedPeriod)

  const approvedMirrors = await prisma.attendanceMirror.findMany({
    where: {
      period: normalizedPeriod,
      status: "APPROVED",
      employee: {
        status: "ACTIVE",
        salaryBase: { not: null },
      },
    },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          socialName: true,
          department: true,
          salaryBase: true,
          vtDailyValue: true,
          vtWorkDaysPerMonth: true,
          transportationAllowance: true,
          transportationPayrollDeductionEnabled: true,
          transportationPayrollDeductionPercent: true,
          foodAllowance: true,
          foodPayrollDeductionEnabled: true,
          foodPayrollDeductionPercent: true,
          fuelAllowance: true,
          costCenterId: true,
          costCenter: {
            select: {
              name: true,
            },
          },
          jobTitle: {
            select: {
              costCenterId: true,
              costCenter: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  isActive: true,
                },
              },
              department: true,
            },
          },
        },
      },
    },
  })

  let generatedCount = 0
  let reusedCount = 0

  await prisma.$transaction(async (tx) => {
    for (const mirror of approvedMirrors) {
      const employee = mirror.employee
      const employeeDisplayName = getEmployeePrimaryName(employee)
      const unifiedClassification = await resolveUnifiedCostClassification(employee)
      const allocationSnapshot = {
        costCenterName: unifiedClassification.costCenterName,
        sectorName: unifiedClassification.sectorName,
      }
      const payableDescription = buildPayrollPayableDescription(employeeDisplayName, allocationSnapshot)
      const payableNotes = buildPayrollPayableNotes(normalizedPeriod, mirror.id, allocationSnapshot)

      if (!employee.salaryBase || employee.salaryBase <= 0) {
        continue
      }

      const payrollValues = calculatePayrollValues(employee, normalizedPeriod, mirror)

      const existingPayroll = await tx.payroll.findFirst({
        where: {
          employeeId: employee.id,
          referencePeriod: normalizedPeriod,
        },
        include: {
          accountsPayable: {
            select: { id: true },
            take: 1,
          },
        },
      })

      if (existingPayroll) {
        const updatedPayrollNotes = buildPayrollAllocationNote(
          allocationSnapshot,
          buildAttendanceMirrorNote(mirror.id, existingPayroll.notes)
        )
        const payrollNeedsRefresh =
          existingPayroll.grossSalary !== payrollValues.grossSalary ||
          existingPayroll.netSalary !== payrollValues.netSalary ||
          existingPayroll.inss !== payrollValues.inss ||
          existingPayroll.fgts !== payrollValues.fgts ||
          existingPayroll.irrf !== payrollValues.irrf ||
          existingPayroll.otherDeductions !== payrollValues.otherDeductions ||
          existingPayroll.otherAdditions !== payrollValues.otherAdditions ||
          updatedPayrollNotes !== (existingPayroll.notes || "")

        if (payrollNeedsRefresh) {
          await tx.payroll.update({
            where: { id: existingPayroll.id },
            data: {
              grossSalary: payrollValues.grossSalary,
              netSalary: payrollValues.netSalary,
              inss: payrollValues.inss,
              fgts: payrollValues.fgts,
              irrf: payrollValues.irrf,
              otherDeductions: payrollValues.otherDeductions,
              otherAdditions: payrollValues.otherAdditions,
              notes: updatedPayrollNotes,
            },
          })
        }

        if (existingPayroll.accountsPayable.length === 0) {
          await tx.accountPayable.create({
            data: {
              description: payableDescription,
              amount: payrollValues.netSalary,
              dueDate,
              payrollId: existingPayroll.id,
              costCenterId: unifiedClassification.costCenterId || undefined,
              financialCategoryId: unifiedClassification.financialCategoryId || undefined,
              notes: payableNotes,
              status: "PENDING",
            },
          })
        } else {
          await tx.accountPayable.updateMany({
            where: {
              payrollId: existingPayroll.id,
            },
            data: {
              description: payableDescription,
              amount: payrollValues.netSalary,
              dueDate,
              costCenterId: unifiedClassification.costCenterId || null,
              financialCategoryId: unifiedClassification.financialCategoryId || null,
              notes: payableNotes,
            },
          })
        }

        reusedCount += 1
        continue
      }

      const payroll = await tx.payroll.create({
        data: {
          employeeId: employee.id,
          referencePeriod: normalizedPeriod,
          grossSalary: payrollValues.grossSalary,
          netSalary: payrollValues.netSalary,
          inss: payrollValues.inss,
          fgts: payrollValues.fgts,
          irrf: payrollValues.irrf,
          otherDeductions: payrollValues.otherDeductions,
          otherAdditions: payrollValues.otherAdditions,
          status: "GENERATED",
          notes: buildPayrollAllocationNote(
            allocationSnapshot,
            buildAttendanceMirrorNote(mirror.id)
          ),
        },
      })

      await tx.accountPayable.create({
        data: {
          description: payableDescription,
          amount: payrollValues.netSalary,
          dueDate,
          payrollId: payroll.id,
          costCenterId: unifiedClassification.costCenterId || undefined,
          financialCategoryId: unifiedClassification.financialCategoryId || undefined,
          notes: payableNotes,
          status: "PENDING",
        },
      })

      generatedCount += 1
    }
  })

  revalidatePath("/rh/folha")

  return {
    period: normalizedPeriod,
    approvedMirrors: approvedMirrors.length,
    generated: generatedCount,
    reused: reusedCount,
  }
}

export async function issuePayrollPdf(payrollId: string) {
  const result = await generateOfficialPayrollPdf(payrollId)

  revalidatePath("/rh/folha")
  revalidatePath(`/rh/funcionarios/${result.employeeId}`)

  return result
}

// Novos métodos para o Analytics e Review Workflow 
export type HoleriteEmployee = {
  id: string
  fullName: string
  socialName: string | null
  photoUrl: string | null
  department: string | null
  jobTitle: {
    name: string
  } | null
  salaryBase: number | null
  status: string
  workSchedule: {
    weeklyHours: number
  } | null
  payroll: {
    id: string
    status: string
    grossSalary: number
    netSalary: number
    otherAdditions: number
    otherDeductions: number
    updatedAt: Date | null
    notes: string | null
  } | null
  attendanceMirror: {
    id: string
    workedMinutes: number
    overtimeMinutes: number
    deficitMinutes: number
    summary: string | null
  } | null
  benefits: {
    vtDailyValue: number | null
    vtWorkDaysPerMonth: number | null
    transportationAllowance: number | null
    transportationPayrollDeductionEnabled: boolean | null
    transportationPayrollDeductionPercent: number | null
    foodAllowance: number | null
    foodPayrollDeductionEnabled: boolean | null
    foodPayrollDeductionPercent: number | null
    fuelAllowance: number | null
    attendanceBonusEnabled: boolean | null
    attendanceBonusAmount: number | null
  }
}

export async function getHoleritesData(period: string, query?: string, department?: string) {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      ...(query ? {
        OR: [
          { fullName: { contains: query } },
          { socialName: { contains: query } },
          { cpf: { contains: query } },
        ]
      } : {}),
      ...(department && department !== "all" ? { department } : {}),
    },
    include: {
      jobTitle: {
        select: { name: true }
      },
      workSchedule: {
        select: { weeklyHours: true }
      },
      attendanceMirrors: {
        where: { period },
        take: 1,
        select: {
          id: true,
          workedMinutes: true,
          overtimeMinutes: true,
          deficitMinutes: true,
          summary: true
        }
      },
      payrolls: {
        where: { referencePeriod: period },
        take: 1,
        select: {
          id: true,
          status: true,
          grossSalary: true,
          netSalary: true,
          otherAdditions: true,
          otherDeductions: true,
          updatedAt: true,
          notes: true
        }
      }
    },
    orderBy: { fullName: "asc" }
  })

  return employees.map(e => ({
    id: e.id,
    fullName: e.fullName,
    socialName: e.socialName,
    photoUrl: e.photoUrl,
    department: e.department,
    jobTitle: e.jobTitle,
    salaryBase: e.salaryBase,
    status: e.status,
    workSchedule: e.workSchedule,
    payroll: e.payrolls[0] || null,
    attendanceMirror: e.attendanceMirrors[0] || null,
    benefits: {
      vtDailyValue: e.vtDailyValue,
      vtWorkDaysPerMonth: e.vtWorkDaysPerMonth,
      transportationAllowance: e.transportationAllowance,
      transportationPayrollDeductionEnabled: e.transportationPayrollDeductionEnabled,
      transportationPayrollDeductionPercent: e.transportationPayrollDeductionPercent,
      foodAllowance: e.foodAllowance,
      foodPayrollDeductionEnabled: e.foodPayrollDeductionEnabled,
      foodPayrollDeductionPercent: e.foodPayrollDeductionPercent,
      fuelAllowance: e.fuelAllowance,
      attendanceBonusEnabled: e.attendanceBonusEnabled,
      attendanceBonusAmount: e.attendanceBonusAmount,
    }
  })) as HoleriteEmployee[]
}

export async function getPayrollStats(period: string) {
  const payrolls = await prisma.payroll.findMany({
    where: { referencePeriod: period }
  })

  const totalGross = payrolls.reduce((acc, p) => acc + p.grossSalary, 0)
  const totalNet = payrolls.reduce((acc, p) => acc + p.netSalary, 0)
  const processedCount = payrolls.length
  
  return {
    totalGross,
    totalNet,
    totalDeductions: totalGross - totalNet,
    processedCount
  }
}

export async function getJobTitlesAndDepartments() {
  const [jobTitles, departmentRows] = await Promise.all([
    prisma.jobTitle.findMany({
      where: { isActive: true },
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    }),
    prisma.employee.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    }),
  ])

  return {
    jobTitles,
    departments: departmentRows.map(d => d.department).filter(Boolean) as string[]
  }
}

export async function saveHolerite(
  employeeId: string, 
  period: string, 
  data: {
    grossSalary: number
    inss: number
    fgts: number
    irrf: number
    otherDeductions: number
    otherAdditions: number
    notes?: string
  }
) {
  // Chamamos generatePayrollForEmployee pois ja faz toda a integracao com contas a pagar
  // mas alteramos o status final para DRAFT conforme o novo workflow
  const payroll = await generatePayrollForEmployee(employeeId, period, data)
  
  // Update final para garantir que eh DRAFT e salvar as notes customizadas
  await prisma.payroll.update({
    where: { id: payroll.id },
    data: {
      status: "DRAFT",
      notes: data.notes
    }
  })

  revalidatePath("/rh/folha")
  return payroll
}

export async function generateBulkHolerites(period: string, department?: string) {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      salaryBase: { not: null },
      ...(department && department !== "all" ? { department } : {}),
      payrolls: {
        none: { referencePeriod: period }
      }
    },
    include: {
      jobTitle: true,
      workSchedule: { select: { weeklyHours: true } },
      attendanceMirrors: {
        where: { period },
        take: 1
      }
    }
  })

  let count = 0
  for (const e of employees) {
    const mirror = e.attendanceMirrors[0]
    const weeklyHours = e.workSchedule?.weeklyHours || 44
    const baseMonthlyHours = weeklyHours * 5
    const hourValue = (e.salaryBase || 0) / baseMonthlyHours
    const dayValue = (e.salaryBase || 0) / 30

    // Benefícios padrão
    const benefits = calculatePayrollBenefitBreakdown({
      salaryBase: e.salaryBase,
      transportationAllowance: e.transportationAllowance,
      transportationPayrollDeductionEnabled: e.transportationPayrollDeductionEnabled,
      transportationPayrollDeductionPercent: e.transportationPayrollDeductionPercent,
      foodAllowance: e.foodAllowance,
      foodPayrollDeductionEnabled: e.foodPayrollDeductionEnabled,
      foodPayrollDeductionPercent: e.foodPayrollDeductionPercent,
      fuelAllowance: e.fuelAllowance,
    })

    // Frequência padrão (Espelho)
    const he50Min = mirror?.overtimeMinutes || 0
    const delayMin = mirror?.deficitMinutes || 0
    const summary = mirror?.summary ? JSON.parse(mirror.summary) : {}
    const absences = summary.absences || 0

    const totalHe50 = (he50Min / 60) * hourValue * 1.5
    const totalDsr = totalHe50 * 0.1667
    const totalDelay = (delayMin / 60) * hourValue
    const totalAbsence = absences * dayValue

    const otherAdditions = benefits.totalAdditions + totalHe50 + totalDsr
    const otherDeductions = benefits.totalDeductions + totalDelay + totalAbsence

    const results = calculatePayrollValuesByPeriod({
      period,
      grossSalary: e.salaryBase || 0,
      otherAdditions,
      otherDeductions
    })

    const detailedNotes = JSON.stringify({
      bonus: e.attendanceBonusAmount || 0,
      gratification: 0,
      vtValue: e.transportationAllowance || 0,
      vrValue: e.foodAllowance || 0,
      fuelValue: e.fuelAllowance || 0,
      he50Min,
      he100Min: 0,
      delayMin,
      absences,
      internalNotes: "Gerado automaticamente em lote."
    })

    await saveHolerite(e.id, period, {
      grossSalary: results.grossSalary,
      inss: results.inss,
      fgts: results.fgts,
      irrf: results.irrf,
      otherAdditions: results.otherAdditions,
      otherDeductions: results.otherDeductions,
      notes: detailedNotes
    })
    count++
  }

  revalidatePath("/rh/folha")
  return { count }
}
