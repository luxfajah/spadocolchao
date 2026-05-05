import { CalendarDays } from "lucide-react"

import { formatDateKey, getHolidaysForRange } from "@/lib/attendance/holidays"
import { cn } from "@/lib/utils"
import { AttendancePeriodPicker } from "./AttendancePeriodPicker"

type AttendanceDayLike = {
  date: Date | string
  status?: string | null
  workedMinutes?: number | null
  overtimeMinutes?: number | null
  deficitMinutes?: number | null
  firstIn?: Date | string | null
  lunchOut?: Date | string | null
  lunchIn?: Date | string | null
  lastOut?: Date | string | null
}

type AttendancePeriodCalendarProps = {
  employeeId: string
  year: number
  month: number
  days: AttendanceDayLike[]
}

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

const WEEKDAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]

const DAY_INDICATORS = {
  complete: {
    label: "Dia com registro completo",
    dotClassName: "bg-emerald-500",
    ringClassName: "ring-emerald-100",
    chipClassName: "border-emerald-100",
  },
  holiday: {
    label: "Feriado",
    dotClassName: "bg-violet-500",
    ringClassName: "ring-violet-100",
    chipClassName: "border-violet-100",
  },
  absent: {
    label: "Falta",
    dotClassName: "bg-rose-500",
    ringClassName: "ring-rose-100",
    chipClassName: "border-rose-100",
  },
  delay: {
    label: "Atraso",
    dotClassName: "bg-amber-400",
    ringClassName: "ring-amber-100",
    chipClassName: "border-amber-100",
  },
  overtime: {
    label: "Hora extra",
    dotClassName: "bg-blue-500",
    ringClassName: "ring-blue-100",
    chipClassName: "border-blue-100",
  },
  weeklyRest: {
    label: "Folga",
    dotClassName: "bg-slate-400",
    ringClassName: "ring-slate-100",
    chipClassName: "border-slate-200",
  },
} as const

function buildCalendarWeeks(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const startOffset = (firstDay.getUTCDay() + 6) % 7

  const cells: Array<number | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  const weeks: Array<Array<number | null>> = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }

  return weeks
}

function buildDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function getTodayKey() {
  const now = new Date()
  return formatDateKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
}

function buildPointPageUrl(employeeId: string, month: number, year: number) {
  return `/rh/ponto/${employeeId}?mes=${month}&ano=${year}`
}

function formatHolidayLabel(name: string) {
  return name.replace(/\s+/g, " ").trim()
}

function buildHolidaySentence(
  holidays: Array<{
    date: string
    name: string
  }>
) {
  if (holidays.length === 0) {
    return null
  }

  return holidays
    .map((holiday) => {
      const [, , day] = holiday.date.split("-")
      return `${Number(day)} ${formatHolidayLabel(holiday.name)}`
    })
    .join(", ")
}

function hasJourneyPunches(day?: AttendanceDayLike | null) {
  return Boolean(day?.firstIn || day?.lunchOut || day?.lunchIn || day?.lastOut)
}

function getDayIndicators(day?: AttendanceDayLike | null, isHoliday = false) {
  if (!day) {
    return isHoliday ? (["holiday"] as Array<keyof typeof DAY_INDICATORS>) : []
  }

  const indicators: Array<keyof typeof DAY_INDICATORS> = []
  const status = day.status || null
  const hasPunches = hasJourneyPunches(day)
  const hasOvertime = (day.overtimeMinutes || 0) > 0
  const hasDelay = (day.deficitMinutes || 0) > 0 || status === "WORKED_INCOMPLETE"

  if (isHoliday || status === "HOLIDAY" || status === "HOLIDAY_WORKED") {
    indicators.push("holiday")
  } else if (
    status === "WEEKLY_REST" ||
    status === "WEEKLY_REST_WORKED" ||
    status === "NO_SCHEDULE"
  ) {
    indicators.push("weeklyRest")
  }

  if (status === "ABSENT") {
    indicators.push("absent")
  }

  if (hasDelay && status !== "ABSENT") {
    indicators.push("delay")
  }

  if (hasOvertime) {
    indicators.push("overtime")
  }

  if (
    hasPunches &&
    (status === "WORKED_COMPLETE" || status === "ADJUSTED") &&
    !hasDelay
  ) {
    indicators.push("complete")
  }

  return indicators
}

export function AttendancePeriodCalendar({
  employeeId,
  year,
  month,
  days,
}: AttendancePeriodCalendarProps) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 0))
  const periodKey = `${year}-${String(month).padStart(2, "0")}`
  const calendarWeeks = buildCalendarWeeks(year, month)
  const todayKey = getTodayKey()
  const previousMonth = month === 1 ? 12 : month - 1
  const previousYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const holidayEntries = Array.from(getHolidaysForRange(monthStart, monthEnd).values())
    .filter((holiday) => holiday.date.startsWith(periodKey))
    .sort((left, right) => left.date.localeCompare(right.date))
  const holidaySentence = buildHolidaySentence(holidayEntries)

  const holidaysByDate = new Map(holidayEntries.map((holiday) => [holiday.date, holiday]))
  const daysByDate = new Map(days.map((day) => [formatDateKey(new Date(day.date)), day]))

  return (
    <div className="rounded-[3rem] border border-slate-100 bg-white p-8 shadow-lahomes xl:min-h-[30rem] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <CalendarDays className="h-32 w-32 text-slate-900" />
      </div>

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-50 pb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-950 font-outfit uppercase italic tracking-tight leading-none">
              Calendario Operacional
            </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Visualização rápida de batidas e inconsistências
              </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AttendancePeriodPicker
              employeeId={employeeId}
              currentPeriod={periodKey}
              previousHref={buildPointPageUrl(employeeId, previousMonth, previousYear)}
              nextHref={buildPointPageUrl(employeeId, nextMonth, nextYear)}
            />
            {holidayEntries.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-violet-600/20">
                {holidayEntries.length} feriado{holidayEntries.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[2.5rem] border border-slate-50 bg-slate-50/40 p-6">
        <div className="grid grid-cols-7 gap-3 mb-4">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 font-outfit"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-3 xl:h-[22rem]"
          style={{ gridTemplateRows: `repeat(${calendarWeeks.length}, minmax(0, 1fr))` }}
        >
          {calendarWeeks.flatMap((week, weekIndex) =>
            week.map((dayNumber, dayIndex) => {
              if (!dayNumber) {
                return (
                  <div
                    key={`empty-${weekIndex}-${dayIndex}`}
                    className="rounded-[1.5rem] bg-white/40 border border-dashed border-slate-100/50"
                  />
                )
              }

              const dateKey = buildDateKey(year, month, dayNumber)
              const holiday = holidaysByDate.get(dateKey)
              const dayData = daysByDate.get(dateKey)
              const indicators = getDayIndicators(dayData, Boolean(holiday))
              const isWeekend = dayIndex >= 5
              const isToday = dateKey === todayKey

                return (
                  <div
                    key={dateKey}
                    className={cn(
                      "rounded-[1.5rem] border p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:scale-[1.02] group/day",
                      holiday
                        ? "border-violet-200 bg-violet-600/5"
                        : isToday
                          ? "border-emerald-200 bg-emerald-500/5"
                        : isWeekend
                          ? "border-slate-100 bg-slate-100/50"
                          : "border-white bg-white shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "text-lg font-black font-outfit italic tracking-tighter transition-colors",
                        holiday
                          ? "text-violet-700"
                          : isToday
                            ? "text-emerald-700 font-black italic"
                            : "text-slate-950 group-hover/day:text-blue-600"
                      )}
                    >
                    {String(dayNumber).padStart(2, "0")}
                  </span>

                    {holiday && (
                       <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    )}
                    {isToday && (
                       <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {indicators.map((indicator) => {
                      const config = DAY_INDICATORS[indicator]
                      return (
                        <span
                          key={`${dateKey}-${indicator}`}
                          className={cn("h-1.5 w-1.5 rounded-full ring-2 ring-white shadow-sm", config.dotClassName)}
                          title={config.label}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {(["complete", "holiday", "absent", "delay", "overtime", "weeklyRest"] as const).map(
            (indicator) => {
              const config = DAY_INDICATORS[indicator]

              return (
                <span
                  key={indicator}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 shadow-sm transition-all hover:bg-white hover:text-slate-900 bg-transparent",
                    config.chipClassName
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full ring-4 ring-white shadow-sm",
                      config.dotClassName
                    )}
                  />
                  {config.label}
                </span>
              )
            }
          )}
        </div>

        {holidaySentence && (
          <p className="mt-6 rounded-[2rem] border-0 bg-slate-950 px-6 py-4 text-[11px] font-black uppercase tracking-[0.1em] leading-relaxed text-white shadow-xl italic">
            <span className="text-blue-400 mr-2">Feriados do periodo:</span>{" "}
            {holidaySentence}.
          </p>
        )}
      </div>
    </div>
  )
}
