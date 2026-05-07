"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClickableRow } from "@/components/ui/ClickableRow"
import { formatDocument } from "@/lib/utils"
import Link from "next/link"
import {
  Search,
  Edit,
  Eye,
  ArrowDownAZ,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react"

type CustomerRow = {
  id: string
  fullName: string
  tradeName: string | null
  document: string | null
  personType: string
  isActive: boolean
  creditLimit: number | null
  addresses: Array<{ city: string | null; state: string | null }>
  _count: { sales: number }
  totalPurchased: number
  purchasesCount: number
  lastPurchaseDate: Date | null
}

type Props = {
  initialCustomers: CustomerRow[]
  initialQuery: string
  initialPage: number
  initialSort: string
  totalCount: number
}

const PAGE_SIZE = 20

export function ClientesListClient({
  initialCustomers,
  initialQuery,
  initialPage,
  initialSort,
  totalCount,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState(initialSort || "date_desc")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateUrl = useCallback(
    (newQuery: string, newPage: number, newSort: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newQuery) {
        params.set("q", newQuery)
      } else {
        params.delete("q")
      }
      params.set("page", String(newPage))
      params.set("sort", newSort)
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [pathname, router, searchParams]
  )

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateUrl(query, 1, sort)
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleSort = (newSort: string) => {
    setSort(newSort)
    updateUrl(query, 1, newSort)
  }

  const handlePage = (newPage: number) => {
    updateUrl(query, newPage, sort)
  }

  const clearSearch = () => {
    setQuery("")
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const page = initialPage

  const sortOptions = [
    { value: "alpha_asc", label: "A → Z", icon: ArrowDownAZ },
    { value: "date_desc", label: "Mais recentes", icon: CalendarDays },
    { value: "date_asc", label: "Mais antigos", icon: CalendarDays },
  ]

  return (
    <div className="space-y-5">
      {/* Search + Sort Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-5 rounded-[2rem] shadow-lahomes border border-slate-50">
        {/* Live search input */}
        <div className="relative w-full xl:w-[440px] group">
          {isPending ? (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          )}
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="pl-12 pr-10 rounded-full border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium shadow-inner bg-slate-50/50"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 hidden sm:block">
            Ordenar
          </span>
          {sortOptions.map(opt => {
            const Icon = opt.icon
            const isActive = sort === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleSort(opt.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                  isActive
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {totalCount === 0 ? (
            "Nenhum resultado"
          ) : (
            <>
              {totalCount} cliente{totalCount !== 1 ? "s" : ""} encontrado
              {totalCount !== 1 ? "s" : ""} · página {page} de {totalPages}
            </>
          )}
        </p>
        {query && (
          <p className="text-[11px] font-medium text-slate-400">
            Pesquisando:{" "}
            <span className="text-primary font-black">&quot;{query}&quot;</span>
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">
                  Cliente / Documento
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Localização
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Limite Crédito
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                  Frequência
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Última Compra
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Status
                </TableHead>
                <TableHead className="text-right pr-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCustomers.map(c => {
                const mainAddress = c.addresses[0]
                return (
                  <ClickableRow
                    key={c.id}
                    href={`/vendas-clientes/clientes/${c.id}`}
                    className="border-slate-50 h-20"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-primary uppercase tracking-tight text-sm font-outfit">
                          {c.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          {formatDocument(c.document) || "SEM DOCUMENTO"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                      {mainAddress ? `${mainAddress.city} - ${mainAddress.state}` : "---"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-black text-primary font-outfit italic">
                        {c.creditLimit?.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }) || "R$ 0,00"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-slate-50 text-slate-500 font-black text-[10px] uppercase rounded-full border border-slate-100 h-6 px-3"
                      >
                        {c._count.sales} Compras
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                      {c.lastPurchaseDate
                        ? new Date(c.lastPurchaseDate).toLocaleDateString("pt-BR")
                        : "Nunca Comprou"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${c.isActive ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-rose-100 text-rose-500"}`}
                      >
                        {c.isActive ? "Ativo" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link href={`/vendas-clientes/clientes/${c.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href={`/vendas-clientes/clientes/${c.id}/editar`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl text-slate-400 border border-transparent hover:border-slate-100 hover:bg-white shadow-sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </ClickableRow>
                )
              })}
              {initialCustomers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs"
                  >
                    {query
                      ? `Nenhum cliente encontrado para "${query}".`
                      : "Nenhum cliente cadastrado ainda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-100 shadow-sm disabled:opacity-30"
            disabled={page <= 1 || isPending}
            onClick={() => handlePage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-sm font-bold">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePage(p as number)}
                    disabled={isPending}
                    className={`h-10 w-10 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                      p === page
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-100 shadow-sm disabled:opacity-30"
            disabled={page >= totalPages || isPending}
            onClick={() => handlePage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
