"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X, SlidersHorizontal, CalendarDays } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type HoleriteFiltersProps = {
  departments: string[]
}

export function HoleriteFilters({ departments }: HoleriteFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [department, setDepartment] = useState(searchParams.get("department") || "")
  const [period, setPeriod] = useState(searchParams.get("period") || new Date().toISOString().slice(0, 7))

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
    setDepartment(searchParams.get("department") || "")
    setPeriod(searchParams.get("period") || new Date().toISOString().slice(0, 7))
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (query) params.set("q", query)
    else params.delete("q")

    if (department && department !== "all") params.set("department", department)
    else params.delete("department")

    if (period) params.set("period", period)

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(nextUrl)
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [query, department, period, router, pathname, searchParams])

  function clearFilters() {
    setQuery("")
    setDepartment("all")
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50 transition-all">
      <div className="relative flex-1 group w-full">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-10 ${
            isPending ? "text-primary animate-pulse" : "text-slate-400 group-focus-within:text-primary"
          }`}
        />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar funcionário por nome ou CPF..."
          className="pl-12 pr-10 rounded-full border-slate-100 focus-visible:ring-primary h-14 text-sm font-medium shadow-sm bg-slate-50/50 transition-all focus:bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <label className="flex items-center gap-3 h-14 px-5 rounded-full border border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-white transition-colors cursor-pointer group">
          <CalendarDays className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
          <input 
            type="month" 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-700"
          />
        </label>

        <Select value={department || "all"} onValueChange={setDepartment}>
          <SelectTrigger className="h-14 rounded-full border-slate-100 bg-slate-50/50 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-primary w-full sm:w-[220px]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Todos os setores" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 p-2">
            <SelectItem value="all" className="rounded-xl font-bold uppercase tracking-widest text-[9px]">Todos os Setores</SelectItem>
            {departments.map(item => (
              <SelectItem key={item} value={item} className="rounded-xl font-bold uppercase tracking-widest text-[9px]">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(query || (department && department !== "all")) && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-14 rounded-full px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all hover:text-rose-500 hover:bg-rose-50"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  )
}
