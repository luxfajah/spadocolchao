"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X, SlidersHorizontal } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EmployeeSearchProps = {
  jobTitles: Array<{
    id: string
    name: string
  }>
  departments: string[]
}

export function EmployeeSearch({ jobTitles, departments }: EmployeeSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [jobTitleId, setJobTitleId] = useState(searchParams.get("jobTitleId") || "")
  const [department, setDepartment] = useState(searchParams.get("department") || "")

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
    setJobTitleId(searchParams.get("jobTitleId") || "")
    setDepartment(searchParams.get("department") || "")
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }

    if (jobTitleId && jobTitleId !== "all") {
      params.set("jobTitleId", jobTitleId)
    } else {
      params.delete("jobTitleId")
    }

    if (department && department !== "all") {
      params.set("department", department)
    } else {
      params.delete("department")
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

    const timer = setTimeout(() => {
      startTransition(() => {
        router.push(nextUrl)
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [query, jobTitleId, department, router, pathname, searchParams])

  function clearFilters() {
    setQuery("")
    setJobTitleId("all")
    setDepartment("all")
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center">
      <div className="relative flex-1 group">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-10 ${
            isPending ? "text-primary animate-pulse" : "text-slate-400 group-focus-within:text-primary"
          }`}
        />

        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome, CPF ou email..."
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

      <div className="flex flex-wrap items-center gap-3">
        <Select value={jobTitleId || "all"} onValueChange={setJobTitleId}>
          <SelectTrigger className="h-14 rounded-full border-slate-100 bg-slate-50/50 px-6 text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-primary w-full sm:w-[240px]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Todos os cargos" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 p-2">
            <SelectItem value="all" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Todos os Cargos</SelectItem>
            {jobTitles.map(jobTitle => (
              <SelectItem key={jobTitle.id} value={jobTitle.id} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                {jobTitle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={department || "all"} onValueChange={setDepartment}>
          <SelectTrigger className="h-14 rounded-full border-slate-100 bg-slate-50/50 px-6 text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-primary w-full sm:w-[200px]">
            <SelectValue placeholder="Todos os setores" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-slate-100 p-2">
            <SelectItem value="all" className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Todos os Setores</SelectItem>
            {departments.map(item => (
              <SelectItem key={item} value={item} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(query || (jobTitleId && jobTitleId !== "all") || (department && department !== "all")) && (
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
