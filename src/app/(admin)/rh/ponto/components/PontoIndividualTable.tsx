"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, AlertTriangle, Settings2, ShieldCheck, History, Info } from "lucide-react"
import { DayAdjustmentModal } from "./DayAdjustmentModal"
import {
  formatAttendanceDate,
  formatBusinessTime,
  getStoredAttendanceWeekDay,
} from "@/lib/attendance/business-time"

interface Props {
  days: any[]
  employeeId: string
  isLocked: boolean
  editingEnabled: boolean
}

function minToHour(min: number) {
  const h = Math.floor(Math.abs(min) / 60)
  const m = Math.abs(min) % 60
  return `${h}h${m > 0 ? `${m.toString().padStart(2, "0")}m` : ""}`
}

const STATUS_LABELS: Record<string, { label: string; bgClass: string; textClass: string }> = {
  WORKED_COMPLETE:   { label: "Completo",      bgClass: "bg-emerald-50",  textClass: "text-emerald-600" },
  WORKED_INCOMPLETE: { label: "Incompleto",    bgClass: "bg-amber-50",    textClass: "text-amber-600" },
  ABSENT:            { label: "Falta",         bgClass: "bg-rose-50",     textClass: "text-rose-600" },
  WEEKLY_REST:       { label: "Folga",         bgClass: "bg-slate-100",   textClass: "text-slate-500" },
  WEEKLY_REST_WORKED:{ label: "Folga Trab.",   bgClass: "bg-slate-100",   textClass: "text-slate-600" },
  HOLIDAY:           { label: "Feriado",       bgClass: "bg-violet-50",   textClass: "text-violet-600" },
  HOLIDAY_WORKED:    { label: "Feriado Trab.", bgClass: "bg-violet-50",   textClass: "text-violet-600" },
  VACATION:          { label: "Ferias",        bgClass: "bg-sky-50",      textClass: "text-sky-600" },
  LEAVE:             { label: "Licenca",       bgClass: "bg-sky-50",      textClass: "text-sky-600" },
  NO_SCHEDULE:       { label: "Sem Escala",    bgClass: "bg-slate-50",    textClass: "text-slate-400" },
  ADJUSTED:          { label: "Ajustado",      bgClass: "bg-indigo-50",   textClass: "text-indigo-600" },
}

const ADJUSTMENT_LABELS: Record<string, string> = {
  ABONO: "Abonado",
  ATESTADO_MEDICO: "Atestado Med.",
  ATESTADO_HORARIO: "Atest. Horario",
  FERIADO: "Feriado",
  FOLGA_PREMIO: "Folga Premio",
  MANUAL: "Manual",
}

export function PontoIndividualTable({ days, employeeId, isLocked, editingEnabled }: Props) {
  const [selectedDay, setSelectedDay] = useState<any | null>(null)

  const openAdjust = (day: any) => {
    if (isLocked || !editingEnabled) return

    setSelectedDay({
      ...day,
      displayDate: formatAttendanceDate(day.date, { day: "2-digit", month: "long" })
    })
  }

  const parseObservations = (anomalies: any): string[] => {
    if (!anomalies) return []
    try {
      const parsed = typeof anomalies === "string" ? JSON.parse(anomalies) : anomalies
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data / Dia</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entrada</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intervalo</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saida</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Total</th>
              <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Saldo</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status / Acao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {days.map((day) => {
              const weekDay = getStoredAttendanceWeekDay(day.date)
              const isWeekend = weekDay === 0 || weekDay === 6
              const obs = parseObservations(day.anomalies)
              const hasAnomaly = obs.some((o: string) => o.includes("ANOMALY") || o.includes("UNKNOWN_TYPE"))
              const hasObs = obs.length > 0
              const isAdjusted = !!day.adjustmentType
              const isHoliday = day.status === "HOLIDAY" || day.status === "HOLIDAY_WORKED"
              const isRest = day.status === "WEEKLY_REST" || day.status === "WEEKLY_REST_WORKED"

              const statusInfo = STATUS_LABELS[day.status] || {
                label: day.status,
                bgClass: "bg-slate-50",
                textClass: "text-slate-600"
              }

              const TimeCell = ({ time, icon: Icon, color }: any) => (
                <div
                  onClick={() => !isLocked && editingEnabled && openAdjust(day)}
                  className={`flex items-center gap-2 font-black text-sm font-outfit transition-all group ${
                    isLocked || !editingEnabled
                      ? "cursor-default"
                      : "cursor-pointer hover:scale-105 active:scale-95"
                  }`}
                >
                  {time ? (
                    <div className={`flex items-center gap-2 ${color}`}>
                      <Icon className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                      {formatBusinessTime(time)}
                    </div>
                  ) : <span className="text-slate-300">--:--</span>}
                </div>
              )

              const holidayObs = obs.find((o: string) => o.startsWith("Feriado:"))
              const holidayName = holidayObs ? holidayObs.replace("Feriado: ", "") : null

              return (
                <tr key={day.id} className={`hover:bg-slate-50/50 transition-all duration-300 group/row ${isHoliday ? "bg-violet-50/20" : isWeekend ? "bg-slate-50/20" : ""}`}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-6">
                      <div className={`h-12 w-12 rounded-[1.25rem] flex flex-col items-center justify-center font-outfit shadow-sm relative transition-transform group-hover/row:scale-110
                        ${isAdjusted ? "bg-slate-900 text-white" :
                          isHoliday ? "bg-violet-600 text-white" :
                          isRest ? "bg-slate-100 text-slate-400 border border-slate-200" :
                          (day.workedMinutes > 0 ? "bg-blue-600 text-white shadow-blue-600/20 shadow-lg" : "bg-white text-slate-400 border border-slate-200")}`}>
                        <span className="text-xs font-black leading-none italic">
                          {formatAttendanceDate(day.date, { day: "2-digit" })}
                        </span>
                        <span className="text-[8px] font-black uppercase opacity-70 tracking-tighter mt-0.5">
                          {formatAttendanceDate(day.date, { weekday: "short" })}
                        </span>
                        {day.isManualAdjustment && (
                          <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center ring-4 ring-white shadow-md animate-in fade-in zoom-in duration-500" title="Editado">
                            <History className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-950 uppercase tracking-tight font-outfit italic">
                          {formatAttendanceDate(day.date, { weekday: "long" })}
                        </p>
                        {holidayName && (
                          <p className="text-[9px] font-black text-violet-600 uppercase tracking-widest mt-1 italic">
                            {holidayName}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <TimeCell time={day.firstIn} icon={LogIn} color="text-slate-950" />
                  </td>
                  <td className="px-6 py-6">
                    {day.lunchOut && day.lunchIn ? (
                      <div
                        onClick={() => !isLocked && editingEnabled && openAdjust(day)}
                        className={`flex items-center gap-2 text-[11px] font-black text-slate-400 font-outfit transition-colors tabular-nums ${
                          isLocked || !editingEnabled ? "cursor-default" : "cursor-pointer hover:text-slate-950"
                        }`}
                      >
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{formatBusinessTime(day.lunchOut)}</span>
                        <span className="opacity-20">—</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded-md">{formatBusinessTime(day.lunchIn)}</span>
                      </div>
                    ) : (
                      <div
                        onClick={() => !isLocked && editingEnabled && openAdjust(day)}
                        className={`text-slate-200 font-black text-xs ${isLocked || !editingEnabled ? "" : "cursor-pointer"}`}
                      >
                        -- : --
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <TimeCell time={day.lastOut} icon={LogOut} color="text-slate-950" />
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`text-sm font-black font-outfit tabular-nums italic lowercase ${day.workedMinutes > 0 ? "text-slate-950" : "text-slate-200"}`}>
                      {day.workedMinutes > 0 ? minToHour(day.workedMinutes) : "--"}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {day.overtimeMinutes > 0 ? (
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-[9px] h-7 px-3 rounded-xl shadow-sm uppercase tracking-tighter tabular-nums italic">
                        +{minToHour(day.overtimeMinutes)}
                      </Badge>
                    ) : day.deficitMinutes > 0 ? (
                      <Badge className="bg-rose-50 text-rose-600 border border-rose-100 font-black text-[9px] h-7 px-3 rounded-xl shadow-sm uppercase tracking-tighter tabular-nums italic">
                        -{minToHour(day.deficitMinutes)}
                      </Badge>
                    ) : (isHoliday || isRest) ? (
                      <span className="text-slate-200 text-xs">—</span>
                    ) : <span className="text-slate-200 font-black text-xs">--</span>}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {hasAnomaly && !isAdjusted && (
                        <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100" title="Registro com inconsistencia">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                      )}

                      {isAdjusted ? (
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 italic" title={day.adjustmentReason}>
                          {ADJUSTMENT_LABELS[day.adjustmentType] || "Ajustado"}
                        </span>
                      ) : (
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl italic border ${statusInfo.bgClass} ${statusInfo.textClass} border-current opacity-70`}>
                          {statusInfo.label}
                        </span>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 rounded-xl transition-all duration-300 ${selectedDay?.id === day.id ? "bg-slate-100" : "hover:bg-slate-100 hover:scale-110 active:scale-90"}`}
                        onClick={() => openAdjust(day)}
                        disabled={isLocked || !editingEnabled}
                      >
                        {isLocked ? (
                          <ShieldCheck className="h-4 w-4 text-slate-300" />
                        ) : (
                          <Settings2
                            className={`h-4 w-4 ${editingEnabled ? "text-slate-400 group-hover/row:text-slate-950" : "text-slate-200"}`}
                          />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedDay && (
        <DayAdjustmentModal
          open={!!selectedDay}
          onOpenChange={(open) => !open && setSelectedDay(null)}
          dayId={selectedDay.id}
          employeeId={employeeId}
          currentDate={selectedDay.displayDate}
          isLocked={isLocked}
          initialData={selectedDay}
        />
      )}
    </>
  )
}
