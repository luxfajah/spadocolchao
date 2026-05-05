"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { format, addMonths, subMonths, parse } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AttendanceHeroPeriodPickerProps = {
  employeeId: string
  currentPeriod: string
}

export function AttendanceHeroPeriodPicker({
  employeeId,
  currentPeriod,
}: AttendanceHeroPeriodPickerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // currentPeriod format: YYYY-MM
  const date = parse(currentPeriod, "yyyy-MM", new Date())

  function navigateTo(newDate: Date) {
    const period = format(newDate, "yyyy-MM")
    startTransition(() => {
      router.push(`/rh/ponto/${employeeId}?periodo=${period}`)
    })
  }

  const months = [
    { value: 0, label: "Janeiro" },
    { value: 1, label: "Fevereiro" },
    { value: 2, label: "Março" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Maio" },
    { value: 5, label: "Junho" },
    { value: 6, label: "Julho" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setembro" },
    { value: 9, label: "Outubro" },
    { value: 10, label: "Novembro" },
    { value: 11, label: "Dezembro" },
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="group relative">
      <div className="flex items-stretch gap-1.5 p-1 rounded-[1.25rem] bg-black/20 border border-white/5 backdrop-blur-md transition-all group-hover:bg-black/30 group-hover:border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo(subMonths(date, 1))}
          disabled={isPending}
          className="h-12 w-10 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isPending}
              className="flex-1 rounded-xl px-4 h-12 hover:bg-white/5 transition-all flex items-center justify-between gap-3 group relative overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 group-hover:text-emerald-400 transition-colors">
                    Competência
                  </span>
                  <span className="text-sm font-black italic font-outfit text-white uppercase tabular-nums">
                    {format(date, "MM/yyyy")}
                  </span>
                </div>
              </div>
              
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter border border-white/5 px-2 py-0.5 rounded-md group-hover:text-slate-400 transition-colors">
                Alterar
              </div>

              {isPending && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="w-80 rounded-[2.5rem] bg-slate-950/95 border-white/10 p-6 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-300"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="font-black font-outfit uppercase italic text-xs text-slate-400 tracking-[0.2em]">
                   Seletor de Período
                </h4>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              
              <div className="grid gap-2 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {years.sort((a, b) => b - a).map(year => (
                  <div key={year} className="space-y-3 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/5" />
                      <span className="text-[11px] font-black italic font-outfit text-slate-500 tracking-widest">{year}</span>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/5" />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {months.map(m => {
                        const isSelected = date.getMonth() === m.value && date.getFullYear() === year
                        return (
                          <button
                            key={m.value}
                            onClick={() => {
                              const newDate = new Date(year, m.value, 1)
                              navigateTo(newDate)
                            }}
                            className={`
                              h-10 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all relative overflow-hidden group/m
                              ${isSelected 
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                                : "text-slate-400 hover:bg-white/5 hover:text-white"}
                            `}
                          >
                            {m.label.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo(addMonths(date, 1))}
          disabled={isPending}
          className="h-12 w-10 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
