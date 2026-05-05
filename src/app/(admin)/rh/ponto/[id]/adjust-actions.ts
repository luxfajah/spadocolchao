"use server"

import { differenceInMinutes } from "date-fns"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import {
  confirmAttendanceMirror,
  getEmployeeMonthAttendanceSource,
  getMirrorByEmployeePeriod,
  recalculateEmployeeMonth,
} from "@/lib/attendance/service"
import {
  createBusinessDateTime,
  getStoredAttendanceDateKey,
} from "@/lib/attendance/business-time"

function parseDayNotes(anomalies?: string | null): string[] {
  if (!anomalies) return []

  try {
    const parsed = typeof anomalies === "string" ? JSON.parse(anomalies) : anomalies
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getToleranceMinutes(day: any): number {
  return day.employee?.workSchedule?.toleranceMinutes || 0
}

function calculateDeficitMinutes(expected: number, worked: number, toleranceMinutes: number): number {
  const deficit = expected - worked
  return deficit > toleranceMinutes ? deficit : 0
}

function resolveBaseStatus(day: any, workedMinutes: number, toleranceMinutes: number): string {
  const isHoliday = parseDayNotes(day.anomalies).some((note) => note.startsWith("Feriado:"))

  if (isHoliday) {
    return workedMinutes > 0 ? "HOLIDAY_WORKED" : "HOLIDAY"
  }

  if (day.expectedMinutes === 0) {
    return workedMinutes > 0 ? "WEEKLY_REST_WORKED" : "WEEKLY_REST"
  }

  if (workedMinutes === 0) {
    return "ABSENT"
  }

  const withinTolerance = workedMinutes + toleranceMinutes >= day.expectedMinutes

  return withinTolerance ? "WORKED_COMPLETE" : "WORKED_INCOMPLETE"
}

function parsePeriod(period: string) {
  const [yearPart, monthPart] = period.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Período inválido para edição do espelho.")
  }

  return { year, month }
}

function buildMirrorSummary(days: any[]) {
  return JSON.stringify({
    absences: days.filter((day) => day.status === "ABSENT").length,
    incomplete: days.filter((day) => day.status === "WORKED_INCOMPLETE").length,
    holidays: days.filter((day) => day.status === "HOLIDAY" || day.status === "HOLIDAY_WORKED").length,
    weeklyRest: days.filter((day) => day.status === "WEEKLY_REST").length,
    holidayWorked: days.filter((day) => day.status === "HOLIDAY_WORKED").length,
    weeklyRestWorked: days.filter((day) => day.status === "WEEKLY_REST_WORKED").length,
    adjusted: days.filter((day) => day.adjustmentType && day.adjustmentType !== "NONE").length,
  })
}

export async function checkMirrorLock(employeeId: string, period: string) {
  const payroll = await prisma.payroll.findFirst({
    where: {
      employeeId,
      referencePeriod: period,
      status: { in: ["GENERATED", "PAID"] },
    },
  })

  return !!payroll
}

async function assertMirrorEditable(day: any, period: string) {
  const isLocked = await checkMirrorLock(day.employeeId, period)
  if (isLocked) {
    throw new Error("Este período está bloqueado porque a folha já foi gerada.")
  }

  if (!day.mirrorId || !day.mirror) {
    throw new Error("Gere o espelho mensal antes de editar este período.")
  }

  if (day.mirror.status === "APPROVED") {
    throw new Error("Espelho confirmado. Clique em Habilitar edições e abonos para reabrir o período.")
  }

  if (!["EDITING", "ADJUSTED"].includes(day.mirror.status)) {
    throw new Error("Edições não habilitadas. Use o botão Habilitar edições e abonos antes de ajustar este espelho.")
  }
}

async function recalculateMirrorTotals(mirrorId: string) {
  const mirror = await prisma.attendanceMirror.findUnique({
    where: { id: mirrorId },
    include: {
      days: true,
    },
  })

  if (!mirror) {
    return
  }

  const totals = mirror.days.reduce(
    (acc: any, day: any) => ({
      expected: acc.expected + day.expectedMinutes,
      worked: acc.worked + day.workedMinutes,
      overtime: acc.overtime + day.overtimeMinutes,
      deficit: acc.deficit + day.deficitMinutes,
    }),
    { expected: 0, worked: 0, overtime: 0, deficit: 0 }
  )

  await prisma.attendanceMirror.update({
    where: { id: mirrorId },
    data: {
      expectedMinutes: totals.expected,
      workedMinutes: totals.worked,
      overtimeMinutes: totals.overtime,
      deficitMinutes: totals.deficit,
      summary: buildMirrorSummary(mirror.days),
      status: "ADJUSTED",
    },
  })
}

export async function enableMirrorEditing(employeeId: string, period: string) {
  const isLocked = await checkMirrorLock(employeeId, period)
  if (isLocked) {
    throw new Error("Não é possível reabrir o espelho porque a folha deste período já foi gerada.")
  }

  const { year, month } = parsePeriod(period)
  const sourceState = await getEmployeeMonthAttendanceSource(employeeId, year, month)
  if (sourceState.importedPunches === 0) {
    throw new Error("Não há batidas importadas neste período. Importe o TXT antes de tratar o espelho.")
  }

  const mirror = await getMirrorByEmployeePeriod(employeeId, period)

  if (!mirror) {
    throw new Error("Processe as batidas deste período antes de habilitar edições.")
  }

  if (!mirror.days?.length) {
    throw new Error("Ainda não há batidas processadas neste período. Processe o período antes de habilitar edições.")
  }

  const updatedMirror = await prisma.attendanceMirror.update({
    where: { id: mirror.id },
    data: {
      status: "EDITING",
    },
  })

  return updatedMirror
}

export async function confirmMirrorChanges(employeeId: string, period: string) {
  const isLocked = await checkMirrorLock(employeeId, period)
  if (isLocked) {
    throw new Error("Não é possível confirmar este espelho porque a folha deste período já foi gerada.")
  }

  const { year, month } = parsePeriod(period)
  const sourceState = await getEmployeeMonthAttendanceSource(employeeId, year, month)
  if (sourceState.importedPunches === 0) {
    throw new Error("Não há batidas importadas neste período. Importe o TXT antes de confirmar o espelho.")
  }

  const existingMirror = await getMirrorByEmployeePeriod(employeeId, period)
  if (!existingMirror) {
    throw new Error("Processe e trate as batidas deste período antes de confirmar o espelho.")
  }

  const mirror = await confirmAttendanceMirror(employeeId, period)

  return mirror
}

export async function adjustAttendanceDay(
  dayId: string,
  data: {
    type: "ABONO" | "ATESTADO_MEDICO" | "ATESTADO_HORARIO" | "FERIADO" | "FOLGA_PREMIO" | "NONE"
    reason?: string
  }
) {
  const day = await prisma.attendanceDay.findUnique({
    where: { id: dayId },
    include: {
      mirror: true,
      employee: { include: { workSchedule: true } },
    },
  })

  if (!day) throw new Error("Dia não encontrado")

  const period = day.mirror?.period || getStoredAttendanceDateKey(day.date).slice(0, 7)
  await assertMirrorEditable(day, period)

  const isAdjustment = data.type !== "NONE"
  const toleranceMinutes = getToleranceMinutes(day)

  const updatedDay = await prisma.attendanceDay.update({
    where: { id: dayId },
    data: {
      adjustmentType: isAdjustment ? data.type : null,
      adjustmentReason: isAdjustment ? data.reason : null,
      workedMinutes: isAdjustment ? day.expectedMinutes : day.workedMinutes,
      overtimeMinutes: isAdjustment ? 0 : day.overtimeMinutes,
      deficitMinutes: isAdjustment
        ? 0
        : calculateDeficitMinutes(day.expectedMinutes, day.workedMinutes, toleranceMinutes),
      status: isAdjustment
        ? "ADJUSTED"
        : resolveBaseStatus(day, day.workedMinutes, toleranceMinutes),
    },
  })

  if (day.mirrorId) {
    await recalculateMirrorTotals(day.mirrorId)
  }

  revalidatePath(`/rh/ponto/${day.employeeId}`)
  return updatedDay
}

export async function updatePunchTimes(
  dayId: string,
  data: {
    firstIn?: string
    lunchOut?: string
    lunchIn?: string
    lastOut?: string
    reason: string
  }
) {
  const day = await prisma.attendanceDay.findUnique({
    where: { id: dayId },
    include: {
      mirror: true,
      employee: { include: { workSchedule: true } },
    },
  })

  if (!day) throw new Error("Dia não encontrado")
  if (!data.reason) throw new Error("A justificativa é obrigatória para alteração de horários")

  const period = day.mirror?.period || getStoredAttendanceDateKey(day.date).slice(0, 7)
  await assertMirrorEditable(day, period)

  const auditData: any = {}
  if (!day.isManualAdjustment) {
    auditData.originalFirstIn = day.firstIn
    auditData.originalLunchOut = day.lunchOut
    auditData.originalLunchIn = day.lunchIn
    auditData.originalLastOut = day.lastOut
    auditData.isManualAdjustment = true
  }

  const updatePunches: any = {}
  const dateKey = getStoredAttendanceDateKey(day.date)

  const parseTime = (timeStr?: string) => {
    if (!timeStr) return null
    return createBusinessDateTime(dateKey, timeStr.length === 5 ? `${timeStr}:00` : timeStr)
  }

  if (data.firstIn !== undefined) updatePunches.firstIn = parseTime(data.firstIn)
  if (data.lunchOut !== undefined) updatePunches.lunchOut = parseTime(data.lunchOut)
  if (data.lunchIn !== undefined) updatePunches.lunchIn = parseTime(data.lunchIn)
  if (data.lastOut !== undefined) updatePunches.lastOut = parseTime(data.lastOut)

  const hasField = (field: string) => Object.prototype.hasOwnProperty.call(updatePunches, field)

  const firstIn = hasField("firstIn") ? updatePunches.firstIn : day.firstIn
  const lunchOut = hasField("lunchOut") ? updatePunches.lunchOut : day.lunchOut
  const lunchIn = hasField("lunchIn") ? updatePunches.lunchIn : day.lunchIn
  const lastOut = hasField("lastOut") ? updatePunches.lastOut : day.lastOut

  let workedMinutes = 0
  if (firstIn && lunchOut) workedMinutes += differenceInMinutes(new Date(lunchOut), new Date(firstIn))
  if (lunchIn && lastOut) workedMinutes += differenceInMinutes(new Date(lastOut), new Date(lunchIn))

  if (firstIn && lastOut && !lunchOut && !lunchIn) {
    workedMinutes = differenceInMinutes(new Date(lastOut), new Date(firstIn))
  }

  const toleranceMinutes = getToleranceMinutes(day)
  const overtimeMinutes = Math.max(0, workedMinutes - day.expectedMinutes)
  const deficitMinutes = calculateDeficitMinutes(day.expectedMinutes, workedMinutes, toleranceMinutes)

  const updatedDay = await prisma.attendanceDay.update({
    where: { id: dayId },
    data: {
      ...updatePunches,
      ...auditData,
      workedMinutes,
      overtimeMinutes,
      deficitMinutes,
      adjustmentReason: data.reason,
      adjustmentType: "MANUAL",
      status: "ADJUSTED",
    },
  })

  if (day.mirrorId) {
    await recalculateMirrorTotals(day.mirrorId)
  }

  revalidatePath(`/rh/ponto/${day.employeeId}`)
  return updatedDay
}
