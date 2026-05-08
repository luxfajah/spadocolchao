import {
  NormalizedPunch,
  PunchRole,
  AttendanceDayResult,
  AttendanceStatus,
} from "./types"
import { getHolidaysForRange } from "./holidays"
import {
  createAttendanceDateFromKey,
  formatBusinessTime,
  getBusinessDateKeyFromInstant,
  getStoredAttendanceDateKey,
  getStoredAttendanceWeekDay,
} from "./business-time"

export interface WorkScheduleConfig {
  mondayMinutes: number
  tuesdayMinutes: number
  wednesdayMinutes: number
  thursdayMinutes: number
  fridayMinutes: number
  saturdayMinutes: number
  sundayMinutes: number
  toleranceMinutes: number
}

const DEFAULT_SCHEDULE: WorkScheduleConfig = {
  mondayMinutes: 480,
  tuesdayMinutes: 480,
  wednesdayMinutes: 480,
  thursdayMinutes: 480,
  fridayMinutes: 480,
  saturdayMinutes: 240,
  sundayMinutes: 0,
  toleranceMinutes: 5,
}

const CONTEXTUAL_FINAL_EXIT_MINUTES = 60

function getExpectedMinutes(weekDay: number, config: WorkScheduleConfig): number {
  switch (weekDay) {
    case 0: return config.sundayMinutes
    case 1: return config.mondayMinutes
    case 2: return config.tuesdayMinutes
    case 3: return config.wednesdayMinutes
    case 4: return config.thursdayMinutes
    case 5: return config.fridayMinutes
    case 6: return config.saturdayMinutes
    default: return 0
  }
}

function calculateWorkedMinutes(start: Date, end: Date): number {
  const diff = (end.getTime() - start.getTime()) / (1000 * 60)
  return Math.max(0, Math.floor(diff))
}

function formatPunchTime(date: Date): string {
  return formatBusinessTime(date, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function calculateDeficitMinutes(expected: number, worked: number, toleranceMinutes: number): number {
  const deficit = expected - worked
  return deficit > toleranceMinutes ? deficit : 0
}

function isWithinTolerance(expected: number, worked: number, toleranceMinutes: number): boolean {
  return calculateDeficitMinutes(expected, worked, toleranceMinutes) === 0
}

function resolveContextualFinalExit(
  dayPunches: NormalizedPunch[],
  lunchIn: NormalizedPunch,
  observations: string[]
): NormalizedPunch | null {
  // Pegamos todas as batidas após o retorno do almoço
  const afterLunchPunches = dayPunches.filter(
    (p) => p.dateTime.getTime() > lunchIn.dateTime.getTime()
  )
  
  if (afterLunchPunches.length === 0) return null

  // A candidata a saída final é a ÚLTIMA batida do dia
  const lastPunch = afterLunchPunches[afterLunchPunches.length - 1]

  // Se a última batida já for formalmente uma SAÍDA FINAL (F), não precisamos de heurística
  if (lastPunch.role === PunchRole.EXIT_FINAL) return null

  // Só aplicamos a heurística se a última batida for um BREAK (I ou O)
  if (lastPunch.role !== PunchRole.BREAK) return null

  const minutesAfterLunch = calculateWorkedMinutes(lunchIn.dateTime, lastPunch.dateTime)

  // Heurística de segurança: Se trabalhou pelo menos 60 min após o almoço 
  // e é a última batida do dia, tratamos como encerramento.
  if (minutesAfterLunch < CONTEXTUAL_FINAL_EXIT_MINUTES) {
    return null
  }

  observations.push(
    `Ultima batida ${lastPunch.rawType} as ${formatPunchTime(lastPunch.dateTime)} tratada como saida final por contexto`
  )

  return lastPunch
}

function pairDayPunches(dayPunches: NormalizedPunch[], isSaturdayHalf: boolean) {
  let entries = dayPunches.filter((p) => p.role === PunchRole.ENTRY_MORNING)
  let lunchOuts = dayPunches.filter((p) => p.role === PunchRole.EXIT_LUNCH)
  let lunchIns = dayPunches.filter((p) => p.role === PunchRole.RETURN_LUNCH)
  let exits = dayPunches.filter((p) => p.role === PunchRole.EXIT_FINAL)
  const breaks = dayPunches.filter((p) => p.role === PunchRole.BREAK)

  const observations: string[] = []

  // REPAIR: Se tivermos múltiplas entradas 'S' e nada mais, é provável que o arquivo seja AFD genérico.
  // Nestes casos, o sistema deve parear sequencialmente para garantir o cálculo de horas.
  if (entries.length > 1 && lunchOuts.length === 0 && lunchIns.length === 0 && exits.length === 0) {
    if (entries.length === 2) {
      exits = [entries[1]]
      entries = [entries[0]]
      observations.push("Pareamento AFD: 2 batidas (S -> F)")
    } else if (entries.length === 3) {
      lunchOuts = [entries[1]]
      exits = [entries[2]]
      entries = [entries[0]]
      observations.push("Pareamento AFD: 3 batidas (S -> E -> F)")
    } else if (entries.length >= 4) {
      lunchOuts = [entries[1]]
      lunchIns = [entries[2]]
      exits = [entries[entries.length - 1]]
      entries = [entries[0]]
      observations.push(`Pareamento AFD: ${dayPunches.length} batidas (S -> E -> A -> F)`)
    }
  }

  const firstIn = entries.length > 0 ? entries[0] : null
  const lunchOut = lunchOuts.length > 0 ? lunchOuts[0] : null
  const lunchIn = lunchIns.length > 0 ? lunchIns[0] : null

  let lastOut = exits.length > 0 ? exits[exits.length - 1] : null
  let contextualFinalExit: NormalizedPunch | null = null

  // Heurística de Saída Final Contextual (Ex: I ou O no fim do dia)
  if (!lastOut && lunchIn) {
    contextualFinalExit = resolveContextualFinalExit(dayPunches, lunchIn, observations)
    if (contextualFinalExit) {
      lastOut = contextualFinalExit
    }
  }

  // NOVA REGRA: Em meio-período (Sábado), se bater apenas S e E, o E é a saída final.
  if (isSaturdayHalf && !lastOut && lunchOut) {
    lastOut = lunchOut
    observations.push("Sábado: É considerado saída final (meio-período)")
  }

  let morningMinutes = 0
  let afternoonMinutes = 0
  let morningComplete = false
  let afternoonComplete = false

  if (firstIn && lunchOut) {
    morningMinutes = calculateWorkedMinutes(firstIn.dateTime, lunchOut.dateTime)
    morningComplete = true
  } else if (firstIn && !lunchOut && isSaturdayHalf) {
    if (lastOut) {
      morningMinutes = calculateWorkedMinutes(firstIn.dateTime, lastOut.dateTime)
      morningComplete = true
      observations.push("Sabado: usado F como saida manha (sem E)")
    }
  } else if (firstIn && !lunchOut && !isSaturdayHalf) {
    observations.push("Falta marcacao de saida para almoco (E)")
  }

  if (lunchIn && lastOut) {
    afternoonMinutes = calculateWorkedMinutes(lunchIn.dateTime, lastOut.dateTime)
    afternoonComplete = true
  } else if (lunchIn && !lastOut) {
    observations.push("Falta marcacao de saida final (F)")
  } else if (!lunchIn && lastOut && !isSaturdayHalf && morningComplete) {
    observations.push("Falta marcacao de retorno do almoco (A)")
  }

  if (isSaturdayHalf && afternoonComplete) {
    observations.push("Sabado: tarde trabalhada (A->F) = horas extras")
  }

  const observableBreaks = breaks.filter((p) => p !== contextualFinalExit)
  if (observableBreaks.length > 0) {
    const breakTimes = observableBreaks.map((p) => `${p.rawType} ${formatPunchTime(p.dateTime)}`)
    observations.push(`Breaks: ${breakTimes.join(", ")}`)
  }

  if (entries.length > 1) observations.push(`${entries.length} entradas S detectadas`)
  if (lunchOuts.length > 1) observations.push(`${lunchOuts.length} saidas E detectadas`)
  if (lunchIns.length > 1) observations.push(`${lunchIns.length} retornos A detectados`)
  if (exits.length > 1) observations.push(`${exits.length} saidas F detectadas`)

  if (isSaturdayHalf && lunchIn && !lastOut) {
    observations.push("Sabado: retorno A orfao sem F - requer revisao manual")
    afternoonMinutes = 0
  }

  if (isSaturdayHalf && !lunchIn && lastOut && morningComplete) {
    observations.push("Sabado: F orfao sem A - requer revisao manual")
  }

  let totalWorked = morningMinutes + afternoonMinutes

  // REPAIR: Para funcionários que trabalham em turno único (como aprendizes), 
  // se houver apenas Entrada (S) e Saída Final (F), calculamos a jornada direta.
  if (firstIn && lastOut && !lunchOut && !lunchIn && dayPunches.length === 2) {
    totalWorked = calculateWorkedMinutes(firstIn.dateTime, lastOut.dateTime)
    morningMinutes = totalWorked
    morningComplete = true
    afternoonComplete = true
    observations.push("Jornada de turno único detectada (S -> F)")
  }

  return {
    firstIn: firstIn?.dateTime || null,
    lunchOut: lunchOut?.dateTime || null,
    lunchIn: lunchIn?.dateTime || null,
    lastOut: lastOut?.dateTime || null,
    morningMinutes,
    afternoonMinutes,
    totalWorked,
    morningComplete,
    afternoonComplete,
    observations,
    hasPunches: dayPunches.length > 0,
    hasJourneyPunches: (firstIn || lunchOut || lunchIn || lastOut) !== null,
  }
}

function determineDayStatus(
  expected: number,
  worked: number,
  hasPunches: boolean,
  morningComplete: boolean,
  afternoonComplete: boolean,
  isSaturday: boolean,
  isHoliday: boolean,
  toleranceMinutes: number,
): AttendanceStatus {
  // 1. Feriados e DSR (Carga Esperada zero)
  if (isHoliday) {
    return hasPunches ? AttendanceStatus.HOLIDAY_WORKED : AttendanceStatus.HOLIDAY
  }

  if (expected === 0) {
    return hasPunches ? AttendanceStatus.WEEKLY_REST_WORKED : AttendanceStatus.WEEKLY_REST
  }

  // 2. Faltas
  if (!hasPunches) {
    return AttendanceStatus.ABSENT
  }

  // 3. Dias Trabalhados
  const complete = isSaturday ? morningComplete : (morningComplete && afternoonComplete)
  
  if (!complete) {
    return AttendanceStatus.WORKED_INCOMPLETE
  }

  // Se a jornada está completa (pares formados), verificamos a tolerância do saldo
  const withinTolerance = isWithinTolerance(expected, worked, toleranceMinutes)

  return withinTolerance
    ? AttendanceStatus.WORKED_COMPLETE
    : AttendanceStatus.WORKED_INCOMPLETE
}

export function calculateAttendanceRange(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  punches: NormalizedPunch[],
  schedule?: WorkScheduleConfig
): AttendanceDayResult[] {
  const results: AttendanceDayResult[] = []
  const config = schedule || DEFAULT_SCHEDULE

  void employeeId

  const holidayMap = getHolidaysForRange(startDate, endDate)
  const punchesByDateKey = new Map<string, NormalizedPunch[]>()

  for (const punch of punches) {
    const dateKey = getBusinessDateKeyFromInstant(punch.dateTime)
    if (!punchesByDateKey.has(dateKey)) {
      punchesByDateKey.set(dateKey, [])
    }
    punchesByDateKey.get(dateKey)!.push(punch)
  }

  let curr = createAttendanceDateFromKey(getStoredAttendanceDateKey(startDate))
  const endUTC = createAttendanceDateFromKey(getStoredAttendanceDateKey(endDate))

  while (curr <= endUTC) {
    const dateKey = getStoredAttendanceDateKey(curr)
    const dayPunches = punchesByDateKey.get(dateKey) || []
    const weekDay = getStoredAttendanceWeekDay(curr)
    const isSaturday = weekDay === 6

    let expected = getExpectedMinutes(weekDay, config)
    const holiday = holidayMap.get(dateKey)
    const isHoliday = !!holiday

    if (isHoliday) {
      expected = 0
    }

    const valid = dayPunches
      .filter((p) => !p.isAnomaly)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())

    const anomalies: string[] = dayPunches
      .filter((p) => p.isAnomaly)
      .map((p) => {
        const time = formatBusinessTime(p.dateTime, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        return `${p.anomalyType || "ANOMALY"} ${p.rawType} as ${time}`
      })

    const isSaturdayHalf = isSaturday && config.saturdayMinutes > 0 && config.saturdayMinutes <= 240
    const pairing = pairDayPunches(valid, isSaturdayHalf)
    const workedMinutes = pairing.totalWorked

    const status = determineDayStatus(
      expected,
      workedMinutes,
      pairing.hasPunches,
      pairing.morningComplete,
      pairing.afternoonComplete,
      isSaturday,
      isHoliday,
      config.toleranceMinutes,
    )

    let overtimeMinutes = 0
    let deficitMinutes = 0

    if (
      status === AttendanceStatus.HOLIDAY_WORKED ||
      status === AttendanceStatus.WEEKLY_REST_WORKED
    ) {
      overtimeMinutes = workedMinutes > 0 ? workedMinutes : 0
    } else if (
      status === AttendanceStatus.HOLIDAY ||
      status === AttendanceStatus.WEEKLY_REST
    ) {
      overtimeMinutes = 0
      deficitMinutes = 0
    } else if (isSaturday && pairing.afternoonComplete) {
      const satExpected = getExpectedMinutes(weekDay, config)
      overtimeMinutes = pairing.afternoonMinutes
      deficitMinutes = calculateDeficitMinutes(
        satExpected,
        pairing.morningMinutes,
        config.toleranceMinutes
      )
    } else if (workedMinutes > expected) {
      overtimeMinutes = workedMinutes - expected
    } else if (workedMinutes < expected) {
      deficitMinutes = calculateDeficitMinutes(
        expected,
        workedMinutes,
        config.toleranceMinutes
      )
    }

    const observations = [...pairing.observations]
    if (isHoliday && holiday) {
      observations.unshift(`Feriado: ${holiday.name}`)
    }

    results.push({
      date: new Date(curr),
      expectedMinutes: isHoliday ? 0 : getExpectedMinutes(weekDay, config),
      workedMinutes,
      overtimeMinutes,
      deficitMinutes,
      firstIn: pairing.firstIn ? new Date(pairing.firstIn) : null,
      lunchOut: pairing.lunchOut ? new Date(pairing.lunchOut) : null,
      lunchIn: pairing.lunchIn ? new Date(pairing.lunchIn) : null,
      lastOut: pairing.lastOut ? new Date(pairing.lastOut) : null,
      status,
      anomalies,
      observations,
      isHoliday,
      holidayName: holiday?.name,
    })

    curr.setUTCDate(curr.getUTCDate() + 1)
  }

  return results
}

export function calculateAttendanceMonth(
  employeeId: string,
  year: number,
  month: number,
  punches: NormalizedPunch[],
  schedule?: WorkScheduleConfig
): AttendanceDayResult[] {
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0))
  return calculateAttendanceRange(employeeId, startDate, endDate, punches, schedule)
}
