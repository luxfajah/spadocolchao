import { prisma } from "@/lib/prisma"
import { getEmployeePrimaryName } from "@/lib/employee-name"

import { calculateAttendanceRange, WorkScheduleConfig } from "./calendar"
import { normalizePunches } from "./normalizer"
import { RawPunch, AttendanceStatus } from "./types"
import {
  createAttendanceDateFromKey,
  getBusinessDayBounds,
  getStoredAttendanceDateKey,
} from "./business-time"
import { buildAttendancePeriodKey, normalizeAttendancePeriod } from "./period"

function buildPunchDateTimeRange(startDate: Date, endDate: Date) {
  const startKey = getStoredAttendanceDateKey(startDate)
  const endKey = getStoredAttendanceDateKey(endDate)

  return {
    gte: getBusinessDayBounds(startKey).start,
    lt: getBusinessDayBounds(endKey).endExclusive,
  }
}

export async function getEmployeeMonthAttendanceSource(employeeId: string, year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0))
  const punchDateTimeRange = buildPunchDateTimeRange(startDate, endDate)

  const [importedPunches, attendanceDays, attendanceMirrors] = await Promise.all([
    (prisma as any).timePunch.count({
      where: {
        employeeId,
        punchDateTime: punchDateTimeRange,
      },
    }),
    (prisma as any).attendanceDay.count({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    }),
    (prisma as any).attendanceMirror.count({
      where: {
        employeeId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    }),
  ])

  return {
    importedPunches,
    attendanceDays,
    attendanceMirrors,
    hasCollectedData: importedPunches > 0 || attendanceDays > 0 || attendanceMirrors > 0,
  }
}

function getPeriodBounds(period: string) {
  const normalizedPeriod = normalizeAttendancePeriod(period)
  const [yearPart, monthPart] = normalizedPeriod.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Período inválido para espelho de ponto.")
  }

  return {
    year,
    month,
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: new Date(Date.UTC(year, month, 0)),
  }
}

function getScheduleConfig(employee: any): WorkScheduleConfig | undefined {
  if (!employee?.workSchedule) {
    return undefined
  }

  const schedule = employee.workSchedule

  return {
    mondayMinutes: schedule.mondayMinutes || 0,
    tuesdayMinutes: schedule.tuesdayMinutes || 0,
    wednesdayMinutes: schedule.wednesdayMinutes || 0,
    thursdayMinutes: schedule.thursdayMinutes || 0,
    fridayMinutes: schedule.fridayMinutes || 0,
    saturdayMinutes: schedule.saturdayMinutes || 0,
    sundayMinutes: schedule.sundayMinutes || 0,
    toleranceMinutes: schedule.toleranceMinutes || 5,
  }
}

function buildMirrorSummaryFromResults(dailyResults: any[]) {
  return JSON.stringify({
    absences: dailyResults.filter((day) => day.status === AttendanceStatus.ABSENT).length,
    incomplete: dailyResults.filter((day) => day.status === AttendanceStatus.WORKED_INCOMPLETE).length,
    holidays: dailyResults.filter(
      (day) => day.status === AttendanceStatus.HOLIDAY || day.status === AttendanceStatus.HOLIDAY_WORKED
    ).length,
    weeklyRest: dailyResults.filter((day) => day.status === AttendanceStatus.WEEKLY_REST).length,
    holidayWorked: dailyResults.filter((day) => day.status === AttendanceStatus.HOLIDAY_WORKED).length,
    weeklyRestWorked: dailyResults.filter((day) => day.status === AttendanceStatus.WEEKLY_REST_WORKED).length,
  })
}

function buildMirrorSummaryFromStoredDays(days: any[]) {
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

function buildMirrorTotalsFromResults(dailyResults: any[]) {
  return {
    expectedMinutes: dailyResults.reduce((acc, day) => acc + day.expectedMinutes, 0),
    workedMinutes: dailyResults.reduce((acc, day) => acc + day.workedMinutes, 0),
    overtimeMinutes: dailyResults.reduce((acc, day) => acc + day.overtimeMinutes, 0),
    deficitMinutes: dailyResults.reduce((acc, day) => acc + day.deficitMinutes, 0),
  }
}

function buildMirrorTotalsFromStoredDays(days: any[]) {
  return {
    expectedMinutes: days.reduce((acc, day) => acc + day.expectedMinutes, 0),
    workedMinutes: days.reduce((acc, day) => acc + day.workedMinutes, 0),
    overtimeMinutes: days.reduce((acc, day) => acc + day.overtimeMinutes, 0),
    deficitMinutes: days.reduce((acc, day) => acc + day.deficitMinutes, 0),
  }
}

const MIRROR_STATUS_PRIORITY: Record<string, number> = {
  APPROVED: 4,
  ADJUSTED: 3,
  EDITING: 2,
  GENERATED: 1,
}

function getMirrorDaysCount(mirror: any) {
  if (Array.isArray(mirror?.days)) {
    return mirror.days.length
  }

  return mirror?._count?.days || 0
}

function hasMirrorMaterializedData(mirror: any) {
  if (getMirrorDaysCount(mirror) > 0) {
    return true
  }

  return (
    Number(mirror?.expectedMinutes || 0) > 0 ||
    Number(mirror?.workedMinutes || 0) > 0 ||
    Number(mirror?.overtimeMinutes || 0) > 0 ||
    Number(mirror?.deficitMinutes || 0) > 0
  )
}

function pickBestMirrorCandidate(mirrors: any[], normalizedPeriod: string) {
  if (!mirrors.length) {
    return null
  }

  const sorted = [...mirrors].sort((left, right) => {
    const leftPeriodMatch =
      normalizeAttendancePeriod(left.period, left.startDate || left.endDate) === normalizedPeriod
    const rightPeriodMatch =
      normalizeAttendancePeriod(right.period, right.startDate || right.endDate) === normalizedPeriod

    if (leftPeriodMatch !== rightPeriodMatch) {
      return leftPeriodMatch ? -1 : 1
    }

    const leftMaterialized = hasMirrorMaterializedData(left)
    const rightMaterialized = hasMirrorMaterializedData(right)
    if (leftMaterialized !== rightMaterialized) {
      return leftMaterialized ? -1 : 1
    }

    const leftStatusPriority = MIRROR_STATUS_PRIORITY[left.status] || 0
    const rightStatusPriority = MIRROR_STATUS_PRIORITY[right.status] || 0
    if (leftStatusPriority !== rightStatusPriority) {
      return rightStatusPriority - leftStatusPriority
    }

    const leftCreatedAt = new Date(left.createdAt || 0).getTime()
    const rightCreatedAt = new Date(right.createdAt || 0).getTime()
    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt - leftCreatedAt
    }

    const leftUpdatedAt = new Date(left.updatedAt || 0).getTime()
    const rightUpdatedAt = new Date(right.updatedAt || 0).getTime()
    return rightUpdatedAt - leftUpdatedAt
  })

  return sorted[0]
}

export async function getMirrorByEmployeePeriod(employeeId: string, period: string) {
  const normalizedPeriod = normalizeAttendancePeriod(period)
  const { startDate, endDate } = getPeriodBounds(normalizedPeriod)

  const mirrors = await (prisma as any).attendanceMirror.findMany({
    where: {
      employeeId,
      OR: [
        { period: normalizedPeriod },
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    },
    include: {
      employee: {
        include: { workSchedule: true },
      },
      days: {
        orderBy: { date: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return pickBestMirrorCandidate(mirrors, normalizedPeriod)
}

export async function importRawPunches(fileName: string, rawPunches: RawPunch[]) {
  const batch = await (prisma as any).timePunchImport.create({
    data: {
      fileName,
      recordsCount: rawPunches.length,
      status: "COMPLETED",
    },
  })

  const pointIds = Array.from(new Set(rawPunches.map((p) => p.enNo)))

  const employees = await (prisma as any).employee.findMany({
    where: {
      OR: [
        { pointMachineId: { in: pointIds } },
        { serialId: { in: pointIds.filter((id) => !isNaN(Number(id))).map((id) => parseInt(id)) } },
      ],
    },
    select: { id: true, pointMachineId: true, serialId: true },
  })

  const employeeMap = new Map<string, string>()
  employees.forEach((employee: any) => {
    if (employee.pointMachineId) employeeMap.set(employee.pointMachineId, employee.id)
    if (employee.serialId) employeeMap.set(employee.serialId.toString(), employee.id)
  })

  await (prisma as any).timePunch.createMany({
    data: rawPunches.map((punch) => ({
      importId: batch.id,
      employeeId: employeeMap.get(punch.enNo) || null,
      enNo: punch.enNo,
      punchDateTime: punch.dateTime,
      type: "UNKNOWN",
      rawType: punch.rawType,
      isNormalized: false,
    })),
  })

  return batch
}

export async function generateMirror(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  periodLabel: string
) {
  const normalizedPeriod = normalizeAttendancePeriod(periodLabel, startDate)
  const punchDateTimeRange = buildPunchDateTimeRange(startDate, endDate)
  const punches = await (prisma as any).timePunch.findMany({
    where: {
      employeeId,
      punchDateTime: punchDateTimeRange,
    },
  })

  const rawPunches: RawPunch[] = punches.map((punch: any) => ({
    enNo: punch.enNo,
    dateTime: punch.punchDateTime,
    rawType: punch.rawType,
  }))

  const normalizedPunches = normalizePunches(rawPunches)

  const employee = await (prisma as any).employee.findUnique({
    where: { id: employeeId },
    include: { workSchedule: true },
  })

  const dailyResults = calculateAttendanceRange(
    employeeId,
    startDate,
    endDate,
    normalizedPunches,
    getScheduleConfig(employee)
  )

  const mirrorTotals = buildMirrorTotalsFromResults(dailyResults)
  const mirrorSummary = buildMirrorSummaryFromResults(dailyResults)

  const mirror = await (prisma as any).$transaction(async (tx: any) => {
    const overlappingMirrors = await tx.attendanceMirror.findMany({
      where: {
        employeeId,
        OR: [
          { period: normalizedPeriod },
          {
            startDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(startDate)),
            endDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(endDate)),
          },
        ],
      },
      include: {
        _count: {
          select: {
            days: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    const existingMirror = pickBestMirrorCandidate(overlappingMirrors, normalizedPeriod)

    const savedMirror = existingMirror
      ? await tx.attendanceMirror.update({
          where: { id: existingMirror.id },
          data: {
            period: normalizedPeriod,
            startDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(startDate)),
            endDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(endDate)),
            ...mirrorTotals,
            status: "GENERATED",
            summary: mirrorSummary,
          },
        })
      : await tx.attendanceMirror.create({
          data: {
            employeeId,
            period: normalizedPeriod,
            startDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(startDate)),
            endDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(endDate)),
            ...mirrorTotals,
            status: "GENERATED",
            summary: mirrorSummary,
          },
        })

    await tx.attendanceDay.deleteMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    })

    await tx.attendanceDay.createMany({
      data: dailyResults.map((result) => ({
        employeeId,
        mirrorId: savedMirror.id,
        date: createAttendanceDateFromKey(getStoredAttendanceDateKey(result.date)),
        expectedMinutes: result.expectedMinutes,
        workedMinutes: result.workedMinutes,
        overtimeMinutes: result.overtimeMinutes,
        deficitMinutes: result.deficitMinutes,
        firstIn: result.firstIn,
        lunchOut: result.lunchOut,
        lunchIn: result.lunchIn,
        lastOut: result.lastOut,
        status: result.status,
        anomalies: JSON.stringify([...result.anomalies, ...result.observations]),
      })),
    })

    return savedMirror
  })

  return mirror
}

export async function recalculateEmployeeMonth(employeeId: string, year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0))
  const periodLabel = buildAttendancePeriodKey(year, month)

  const punchDateTimeRange = buildPunchDateTimeRange(startDate, endDate)
  const punches = await (prisma as any).timePunch.findMany({
    where: {
      employeeId,
      punchDateTime: punchDateTimeRange,
    },
  })

  const rawPunches: RawPunch[] = punches.map((punch: any) => ({
    enNo: punch.enNo,
    dateTime: punch.punchDateTime,
    rawType: punch.rawType,
  }))

  const normalizedPunches = normalizePunches(rawPunches)

  const employee = await (prisma as any).employee.findUnique({
    where: { id: employeeId },
    include: { workSchedule: true },
  })

  const dailyResults = calculateAttendanceRange(
    employeeId,
    startDate,
    endDate,
    normalizedPunches,
    getScheduleConfig(employee)
  )

  const existingDays = await (prisma as any).attendanceDay.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
  })

  const existingAdjustments = new Map<string, any>()
  for (const day of existingDays) {
    if (day.adjustmentType && day.adjustmentType !== "NONE") {
      const dateKey = getStoredAttendanceDateKey(day.date)
      existingAdjustments.set(dateKey, {
        adjustmentType: day.adjustmentType,
        adjustmentReason: day.adjustmentReason,
        isManualAdjustment: day.isManualAdjustment,
      })
    }
  }

  const mirrorTotals = buildMirrorTotalsFromResults(dailyResults)
  const mirrorSummary = buildMirrorSummaryFromResults(dailyResults)

  await (prisma as any).$transaction(async (tx: any) => {
    await tx.attendanceDay.deleteMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    })

    const overlappingMirrors = await tx.attendanceMirror.findMany({
      where: {
        employeeId,
        OR: [
          { period: periodLabel },
          {
            startDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(startDate)),
            endDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(endDate)),
          },
        ],
      },
      include: {
        _count: {
          select: {
            days: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    const existingMirror = pickBestMirrorCandidate(overlappingMirrors, periodLabel)

    const mirror = existingMirror
      ? await tx.attendanceMirror.update({
          where: { id: existingMirror.id },
          data: {
            period: periodLabel,
            ...mirrorTotals,
            status: "GENERATED",
            summary: mirrorSummary,
          },
        })
      : await tx.attendanceMirror.create({
          data: {
            employeeId,
            period: periodLabel,
            startDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(startDate)),
            endDate: createAttendanceDateFromKey(getStoredAttendanceDateKey(endDate)),
            ...mirrorTotals,
            status: "GENERATED",
            summary: mirrorSummary,
          },
        })

    await tx.attendanceDay.createMany({
      data: dailyResults.map((result) => {
        const dateKey = getStoredAttendanceDateKey(result.date)
        const adjustment = existingAdjustments.get(dateKey)

        return {
          employeeId,
          mirrorId: mirror.id,
          date: createAttendanceDateFromKey(dateKey),
          expectedMinutes: result.expectedMinutes,
          workedMinutes: adjustment ? result.expectedMinutes : result.workedMinutes,
          overtimeMinutes: adjustment ? 0 : result.overtimeMinutes,
          deficitMinutes: adjustment ? 0 : result.deficitMinutes,
          firstIn: result.firstIn,
          lunchOut: result.lunchOut,
          lunchIn: result.lunchIn,
          lastOut: result.lastOut,
          status: adjustment ? "ADJUSTED" : result.status,
          anomalies: JSON.stringify([...result.anomalies, ...result.observations]),
          adjustmentType: adjustment?.adjustmentType || null,
          adjustmentReason: adjustment?.adjustmentReason || null,
          isManualAdjustment: adjustment?.isManualAdjustment || false,
        }
      }),
    })
  })

  return dailyResults
}

export async function recalculateCompetency(period: string) {
  const { year, month } = getPeriodBounds(period)

  const activeEmployees = await (prisma as any).employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, fullName: true, socialName: true },
  })

  const existingMirrors = await (prisma as any).attendanceMirror.findMany({
    where: { period },
    include: { employee: true },
  })

  const employeesMap = new Map<string, { id: string; fullName: string; socialName?: string | null }>()

  for (const employee of activeEmployees) {
    employeesMap.set(employee.id, employee)
  }

  for (const mirror of existingMirrors) {
    employeesMap.set(mirror.employeeId, {
      id: mirror.employeeId,
      fullName: mirror.employee?.fullName || "Sem nome",
      socialName: mirror.employee?.socialName || null,
    })
  }

  const results: { employeeId: string; name: string; success: boolean; error?: string }[] = []

  for (const employee of Array.from(employeesMap.values())) {
    try {
      await recalculateEmployeeMonth(employee.id, year, month)
      results.push({
        employeeId: employee.id,
        name: getEmployeePrimaryName(employee),
        success: true,
      })
    } catch (error: any) {
      results.push({
        employeeId: employee.id,
        name: getEmployeePrimaryName(employee),
        success: false,
        error: error.message,
      })
    }
  }

  return results
}

export async function recalculateAll() {
  const mirrors = await (prisma as any).attendanceMirror.findMany({
    select: {
      employeeId: true,
      period: true,
      employee: { select: { fullName: true, socialName: true } },
    },
  })

  const results: { employeeId: string; period: string; name: string; success: boolean; error?: string }[] = []

  for (const mirror of mirrors) {
    try {
      const { year, month } = getPeriodBounds(mirror.period)
      await recalculateEmployeeMonth(mirror.employeeId, year, month)
      results.push({
        employeeId: mirror.employeeId,
        period: mirror.period,
        name: getEmployeePrimaryName(mirror.employee || {}),
        success: true,
      })
    } catch (error: any) {
      results.push({
        employeeId: mirror.employeeId,
        period: mirror.period,
        name: getEmployeePrimaryName(mirror.employee || {}),
        success: false,
        error: error.message,
      })
    }
  }

  return results
}

export async function getMirrorsHistory() {
  return (prisma as any).attendanceMirror.findMany({
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function confirmAttendanceMirror(employeeId: string, period: string) {
  const normalizedPeriod = normalizeAttendancePeriod(period)
  const { year, month } = getPeriodBounds(normalizedPeriod)
  let mirror = await getMirrorByEmployeePeriod(employeeId, normalizedPeriod)

  if (!mirror || mirror.days.length === 0) {
    await recalculateEmployeeMonth(employeeId, year, month)
    mirror = await getMirrorByEmployeePeriod(employeeId, normalizedPeriod)
  }

  if (!mirror) {
    throw new Error("Não foi possível localizar o espelho para confirmar este período.")
  }

  if (mirror.days.length === 0) {
    throw new Error("Não foi possível confirmar um espelho vazio. Recalcule o mês para materializar os dias tratados.")
  }

  const totals = buildMirrorTotalsFromStoredDays(mirror.days)
  const summary = buildMirrorSummaryFromStoredDays(mirror.days)

  return (prisma as any).attendanceMirror.update({
    where: { id: mirror.id },
    data: {
      ...totals,
      status: "APPROVED",
      summary,
    },
    include: {
      employee: true,
      days: {
        orderBy: { date: "asc" },
      },
    },
  })
}

export async function getMirrorById(id: string) {
  return (prisma as any).attendanceMirror.findUnique({
    where: { id },
    include: {
      employee: {
        include: { workSchedule: true },
      },
      days: {
        orderBy: { date: "asc" },
      },
    },
  })
}

export async function getEmployeeAttendanceCalendarMonth(employeeId: string, year: number, month: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0))

  const days = await (prisma as any).attendanceDay.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  })

  return days.map((day: any) => ({
    ...day,
    anomalies: day.anomalies ? JSON.parse(day.anomalies) : [],
  }))
}
