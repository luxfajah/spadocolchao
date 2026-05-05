"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"

export function PontoEmployeeSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (query.trim()) {
      params.set("q", query.trim())
    } else {
      params.delete("q")
    }

    const timer = setTimeout(() => {
      startTransition(() => {
        const nextQuery = params.toString()
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [query, router, pathname, searchParams])

  return (
    <div className="relative w-full xl:w-auto">
      <div className="relative w-full md:w-96 group">
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors font-bold ${
            isPending ? "text-indigo-500 animate-pulse" : "text-slate-400 group-focus-within:text-indigo-500"
          }`}
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar colaborador..."
          className="pl-12 pr-10 rounded-full border-slate-100 focus-visible:ring-indigo-500 h-12 text-sm font-medium shadow-inner bg-slate-50/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
