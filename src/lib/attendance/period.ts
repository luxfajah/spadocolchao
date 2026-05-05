type PeriodLike = {
  period?: string | null
  startDate?: Date | string | null
  endDate?: Date | string | null
  createdAt?: Date | string | null
}

const MONTHS: Record<string, string> = {
  janeiro: "01",
  fevereiro: "02",
  marco: "03",
  março: "03",
  abril: "04",
  maio: "05",
  junho: "06",
  julho: "07",
  agosto: "08",
  setembro: "09",
  outubro: "10",
  novembro: "11",
  dezembro: "12",
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

export function buildAttendancePeriodKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`
}

export function resolveAttendancePeriodFromDate(value?: Date | string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return buildAttendancePeriodKey(date.getUTCFullYear(), date.getUTCMonth() + 1)
}

export function normalizeAttendancePeriod(period?: string | null, fallbackDate?: Date | string | null) {
  const trimmedPeriod = period?.trim() || ""

  if (/^\d{4}-\d{2}$/.test(trimmedPeriod)) {
    return trimmedPeriod
  }

  const slashMatch = trimmedPeriod.match(/^(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    return buildAttendancePeriodKey(Number(slashMatch[2]), Number(slashMatch[1]))
  }

  const normalizedText = normalizeText(trimmedPeriod)
  const longMonthMatch = normalizedText.match(/^([a-z]+)\s+de\s+(\d{4})$/)

  if (longMonthMatch) {
    const month = MONTHS[longMonthMatch[1]]
    if (month) {
      return `${longMonthMatch[2]}-${month}`
    }
  }

  return resolveAttendancePeriodFromDate(fallbackDate) || trimmedPeriod
}

export function formatAttendancePeriodLabel(period?: string | null, fallbackDate?: Date | string | null) {
  const normalizedPeriod = normalizeAttendancePeriod(period, fallbackDate)
  const match = normalizedPeriod.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    return period?.trim() || "--"
  }

  return `${match[2]}/${match[1]}`
}

function getMirrorSortValue(item: PeriodLike) {
  const candidate =
    item.endDate ||
    item.startDate ||
    item.createdAt ||
    normalizeAttendancePeriod(item.period, item.startDate || item.endDate || item.createdAt)

  return new Date(candidate as Date | string).getTime() || 0
}

export function dedupeAttendanceMirrorsByPeriod<T extends PeriodLike>(mirrors: T[]) {
  const sortedMirrors = [...mirrors].sort((left, right) => getMirrorSortValue(right) - getMirrorSortValue(left))
  const uniqueMirrors = new Map<string, T>()

  for (const mirror of sortedMirrors) {
    const normalizedPeriod = normalizeAttendancePeriod(
      mirror.period,
      mirror.startDate || mirror.endDate || mirror.createdAt
    )

    if (!uniqueMirrors.has(normalizedPeriod)) {
      uniqueMirrors.set(normalizedPeriod, mirror)
    }
  }

  return Array.from(uniqueMirrors.values())
}
