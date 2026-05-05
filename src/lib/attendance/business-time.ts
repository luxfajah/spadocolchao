export const BUSINESS_TIME_ZONE = "America/Sao_Paulo"
const DISPLAY_LOCALE = "pt-BR"

type DateInput = Date | string

interface DateTimeParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value)
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return { year, month, day }
}

function parseTimeString(time: string) {
  const [hour = "0", minute = "0", second = "0"] = time.split(":")
  return {
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  }
}

function getDateTimeParts(date: Date, timeZone: string): DateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const record = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value
    }
    return acc
  }, {})

  return {
    year: record.year,
    month: record.month,
    day: record.day,
    hour: record.hour,
    minute: record.minute,
    second: record.second,
  }
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset",
  })

  const offsetLabel = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value || "GMT"

  if (offsetLabel === "GMT") {
    return 0
  }

  const match = offsetLabel.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) {
    return 0
  }

  const sign = match[1] === "-" ? -1 : 1
  const hours = Number(match[2])
  const minutes = Number(match[3] || "0")

  return sign * (hours * 60 + minutes)
}

export function getStoredAttendanceDateKey(value: DateInput): string {
  const date = toDate(value)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function getBusinessDateKeyFromInstant(value: DateInput): string {
  const parts = getDateTimeParts(toDate(value), BUSINESS_TIME_ZONE)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function createAttendanceDateFromKey(dateKey: string): Date {
  const { year, month, day } = parseDateKey(dateKey)
  return new Date(Date.UTC(year, month - 1, day))
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const { year, month, day } = parseDateKey(dateKey)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return getStoredAttendanceDateKey(date)
}

export function getStoredAttendanceWeekDay(value: DateInput): number {
  const { year, month, day } = parseDateKey(getStoredAttendanceDateKey(value))
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
}

export function formatAttendanceDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    timeZone: "UTC",
    ...options,
  }).format(toDate(value))
}

export function formatBusinessTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    timeZone: BUSINESS_TIME_ZONE,
    hour12: false,
    ...options,
  }).format(toDate(value))
}

export function createBusinessDateTime(dateKey: string, time: string): Date {
  const { year, month, day } = parseDateKey(dateKey)
  const { hour, minute, second } = parseTimeString(time)

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second)

  for (let i = 0; i < 2; i++) {
    const offsetMinutes = getTimeZoneOffsetMinutes(BUSINESS_TIME_ZONE, new Date(utcMs))
    utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60 * 1000
  }

  return new Date(utcMs)
}

/**
 * Converte uma data/hora local de São Paulo para um objeto Date (UTC instant).
 * Essencial para ler batidas do arquivo AFD/TXT que não possuem timezone.
 */
export function createInstantFromBusinessDateTime(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second)

  // Aplicar o offset de São Paulo para chegar no instante UTC real
  // Faremos 2 passagens para lidar com transições de horário (se houver, embora SP não tenha mais HV)
  for (let i = 0; i < 2; i++) {
    const offsetMinutes = getTimeZoneOffsetMinutes(BUSINESS_TIME_ZONE, new Date(utcMs))
    utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60 * 1000
  }

  return new Date(utcMs)
}

export function getBusinessDayBounds(dateKey: string) {
  return {
    start: createBusinessDateTime(dateKey, "00:00:00"),
    endExclusive: createBusinessDateTime(addDaysToDateKey(dateKey, 1), "00:00:00"),
  }
}
