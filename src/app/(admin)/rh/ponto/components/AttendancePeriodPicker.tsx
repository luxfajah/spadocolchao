"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarDays, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AttendancePeriodPickerProps = {
  employeeId: string
  currentPeriod: string
  previousHref: string
  nextHref: string
}

export function AttendancePeriodPicker({
  employeeId,
  currentPeriod,
  previousHref,
  nextHref,
}: AttendancePeriodPickerProps) {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setSelectedPeriod(currentPeriod)
  }, [currentPeriod])

  function navigateTo(url: string) {
    startTransition(() => {
      router.push(url)
    })
  }

  function handlePeriodChange(value: string) {
    setSelectedPeriod(value)

    if (!/^\d{4}-\d{2}$/.test(value)) {
      return
    }

    navigateTo(`/rh/ponto/${employeeId}?periodo=${value}`)
  }

  return (
    <div className="grid gap-2 lg:grid-cols-[auto_minmax(14rem,1fr)_auto] lg:items-center">
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigateTo(previousHref)}
        disabled={isPending}
        className="w-full rounded-full h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-[0.16em] gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Anterior
      </Button>

      <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-100 bg-slate-50/70 px-3 py-2">
        <CalendarDays className="h-4 w-4 text-indigo-500" />
        <Input
          type="month"
          value={selectedPeriod}
          onChange={(event) => handlePeriodChange(event.target.value)}
          disabled={isPending}
          className="h-8 border-none bg-transparent px-0 font-bold text-slate-700 shadow-none focus-visible:ring-0"
        />
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={() => navigateTo(nextHref)}
        disabled={isPending}
        className="w-full rounded-full h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-[0.16em] gap-2"
      >
        Proximo
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
