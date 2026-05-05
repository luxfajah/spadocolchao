"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, UserRound, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EmployeeOption = {
  id: string
  label: string
  meta?: string | null
}

export function PontoHistoryEmployeeFilter({
  initialQuery = "",
  selectedEmployeeId = "",
  employeeOptions,
}: {
  initialQuery?: string
  selectedEmployeeId?: string
  employeeOptions: EmployeeOption[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    const currentQuery = searchParams.get("q") || ""
    const trimmedQuery = query.trim()

    if (trimmedQuery === currentQuery.trim()) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())

    if (trimmedQuery) {
      params.set("q", trimmedQuery)
    } else {
      params.delete("q")
    }

    params.delete("employeeId")

    const timer = setTimeout(() => {
      startTransition(() => {
        const nextQuery = params.toString()
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [query, pathname, router, searchParams])

  function handleEmployeeChange(value: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set("employeeId", value)
      } else {
        params.delete("employeeId")
      }

      const nextQuery = params.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
    })
  }

  function clearFilters() {
    setQuery("")
    startTransition(() => {
      router.replace(pathname)
    })
  }

  const canSelectEmployee = employeeOptions.length > 0
  const selectPlaceholder = query.trim()
    ? canSelectEmployee
      ? "Selecione o funcionario"
      : "Nenhum funcionario encontrado"
    : "Digite um nome para buscar"

  return (
    <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[42rem]">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative w-full md:flex-[1.1] group">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
              isPending ? "text-indigo-500 animate-pulse" : "text-slate-300 group-focus-within:text-indigo-500"
            }`}
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome..."
            className="pl-12 pr-10 rounded-2xl border-slate-100 focus-visible:ring-indigo-500 h-12 text-sm font-bold shadow-inner bg-slate-50/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors"
              aria-label="Limpar nome pesquisado"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="relative w-full md:flex-1">
          <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
          <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange} disabled={!canSelectEmployee}>
            <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 pl-12 pr-4 text-sm font-bold shadow-inner focus:ring-indigo-500">
              <SelectValue placeholder={selectPlaceholder} />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100">
              {employeeOptions.map((employee) => (
                <SelectItem
                  key={employee.id}
                  value={employee.id}
                  className="rounded-xl py-3 pr-4"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{employee.label}</span>
                    {employee.meta && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {employee.meta}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(query || selectedEmployeeId) && (
          <Button
            type="button"
            variant="ghost"
            onClick={clearFilters}
            className="h-12 rounded-full px-6 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-rose-500"
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
