"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarRange, Edit, FolderCog, LayoutDashboard, PlusCircle, Power, Search, Target, TrendingDown, TrendingUp, Wallet, Layers3 } from "lucide-react"
import { saveCostCenter, toggleCostCenterStatus } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/PageHeader"

type CategoryOption = { id: string; code: string; name: string; type: string; isActive?: boolean }
type Center = { id: string; code: string; name: string; description?: string | null; isActive: boolean; financialCategories?: CategoryOption[] }
type Payable = { id: string; description: string; amount: number; paidAmount: number; pendingAmount: number; costCenterId?: string | null; costCenterCode?: string | null; costCenterName?: string | null; financialCategoryId?: string | null; financialCategoryCode?: string | null; financialCategoryName?: string | null; financialCategoryIsMirrored?: boolean }
type DashboardData = { centers: Center[]; payables: Payable[]; selectedPeriod: string }
type MetricRow = { id: string; name: string; code: string; totalAmount: number; paidAmount: number; pendingAmount: number; payableCount: number; isActive?: boolean; isMirrored?: boolean }
type FormState = { id: string; code: string; name: string; description: string; categoryIds: string[]; isActive: boolean }

const emptyForm: FormState = { id: "", code: "", name: "", description: "", categoryIds: [], isActive: true }

const normalize = (value?: string | null) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
const periodLabel = (period: string) => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1, 1))
const shiftPeriod = (period: string, delta: number) => { const d = new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)) - 1 + delta, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` }

function aggregateCenters(centers: Center[], payables: Payable[]) {
  const map = new Map<string, MetricRow>(centers.map(center => [center.id, { id: center.id, name: center.name, code: center.code, totalAmount: 0, paidAmount: 0, pendingAmount: 0, payableCount: 0, isActive: center.isActive }]))
  for (const payable of payables) {
    if (!payable.costCenterId || !map.has(payable.costCenterId)) continue
    const row = map.get(payable.costCenterId)!
    row.totalAmount += payable.amount || 0
    row.paidAmount += payable.paidAmount || 0
    row.pendingAmount += payable.pendingAmount || 0
    row.payableCount += 1
  }
  return Array.from(map.values())
}

function aggregateCategories(payables: Payable[]) {
  const map = new Map<string, MetricRow>()
  for (const payable of payables) {
    let id = payable.financialCategoryId || "uncategorized"
    let name = payable.financialCategoryName || "Sem categoria"
    let code = payable.financialCategoryCode || "SEM_CATEGORIA"
    const isMirrored = Boolean(payable.financialCategoryIsMirrored)



    if (!map.has(id)) {
      map.set(id, { id, name, code, totalAmount: 0, paidAmount: 0, pendingAmount: 0, payableCount: 0, isMirrored })
    }
    const row = map.get(id)!
    row.totalAmount += payable.amount || 0
    row.paidAmount += payable.paidAmount || 0
    row.pendingAmount += payable.pendingAmount || 0
    row.payableCount += 1
  }
  return Array.from(map.values()).filter(row => row.totalAmount > 0)
}

export function CCClient({ dashboard, categories, selectedPeriod }: { dashboard: DashboardData; categories: CategoryOption[]; selectedPeriod: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showDialog, setShowDialog] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [query, setQuery] = useState("")
  const [centerFilter, setCenterFilter] = useState("all")
  const [periodInput, setPeriodInput] = useState(selectedPeriod)
  const [loading, setLoading] = useState(false)

  useEffect(() => setPeriodInput(selectedPeriod), [selectedPeriod])

  const updatePeriod = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", next)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const scopedPayables = useMemo(() => (
    centerFilter === "all"
      ? dashboard.payables
      : dashboard.payables.filter(payable => payable.costCenterId === centerFilter)
  ), [centerFilter, dashboard.payables])

  const filteredPayables = useMemo(() => {
    const q = normalize(query)
    return scopedPayables.filter(payable => (
      !q || [
        payable.description,
        payable.costCenterName,
        payable.costCenterCode,
        payable.financialCategoryName,
        payable.financialCategoryCode,
      ]
        .filter(Boolean)
        .some(value => normalize(value).includes(q))
    ))
  }, [query, scopedPayables])

  const globalCenterMetrics = useMemo(
    () => aggregateCenters(dashboard.centers, dashboard.payables),
    [dashboard.centers, dashboard.payables]
  )
  const centerMetrics = useMemo(() => (
    centerFilter === "all"
      ? globalCenterMetrics
      : globalCenterMetrics.filter(row => row.id === centerFilter)
  ), [centerFilter, globalCenterMetrics])
  const categoryMetrics = useMemo(() => aggregateCategories(scopedPayables), [scopedPayables])
  const costlyCenters = useMemo(() => [...globalCenterMetrics].filter(row => row.totalAmount > 0).sort((a, b) => b.totalAmount - a.totalAmount), [globalCenterMetrics])
  const cheapCenters = useMemo(() => [...costlyCenters].sort((a, b) => a.totalAmount - b.totalAmount), [costlyCenters])
  const costlyCategories = useMemo(() => [...categoryMetrics].sort((a, b) => b.totalAmount - a.totalAmount), [categoryMetrics])
  const cheapCategories = useMemo(() => [...categoryMetrics].sort((a, b) => a.totalAmount - b.totalAmount), [categoryMetrics])

  const selectedCenterMetric = useMemo(
    () => (centerFilter === "all" ? null : centerMetrics[0] || null),
    [centerFilter, centerMetrics]
  )
  const selectedCenterData = useMemo(
    () => (centerFilter === "all" ? null : dashboard.centers.find(center => center.id === centerFilter) || null),
    [centerFilter, dashboard.centers]
  )

  const summary = useMemo(() => ({
    total: scopedPayables.reduce((sum, row) => sum + row.amount, 0),
    paid: scopedPayables.reduce((sum, row) => sum + row.paidAmount, 0),
    pending: scopedPayables.reduce((sum, row) => sum + row.pendingAmount, 0),
    payableCount: scopedPayables.length,
  }), [scopedPayables])

  const summaryCards = useMemo(() => {
    if (centerFilter !== "all") {
      return [
        {
          title: "Despesa total do centro",
          headline: formatCurrency(selectedCenterMetric?.totalAmount || 0),
          accent: null,
          accentClass: "",
          footer: `${selectedCenterData?.name || "Centro selecionado"} no período filtrado`,
          featured: true,
        },
        {
          title: "Valor pago do centro",
          headline: formatCurrency(selectedCenterMetric?.paidAmount || 0),
          accent: selectedCenterData?.code || "CENTRO",
          accentClass: "text-emerald-600",
          footer: "Títulos já liquidados dentro deste centro",
          featured: false,
        },
        {
          title: "Saldo aberto do centro",
          headline: formatCurrency(selectedCenterMetric?.pendingAmount || 0),
          accent: `${summary.payableCount} títulos`,
          accentClass: "text-amber-600",
          footer: "Valor que ainda segue em aberto neste centro",
          featured: false,
        },
        {
          title: "Categoria mais custosa do centro",
          headline: costlyCategories[0]?.name || "Sem categoria com gasto",
          accent: costlyCategories[0] ? formatCurrency(costlyCategories[0].totalAmount) : "--",
          accentClass: "text-indigo-600",
          footer: "Categoria que mais concentrou despesa neste centro",
          featured: false,
        },
        {
          title: "Categoria menos custosa do centro",
          headline: cheapCategories[0]?.name || "Sem categoria com gasto",
          accent: cheapCategories[0] ? formatCurrency(cheapCategories[0].totalAmount) : "--",
          accentClass: "text-sky-600",
          footer: "Categoria mais leve dentro do centro selecionado",
          featured: false,
        },
        {
          title: "Títulos do centro",
          headline: String(summary.payableCount),
          accent: formatCurrency(summary.total),
          accentClass: "text-amber-600",
          footer: "Quantidade de títulos e volume total do centro",
          featured: false,
        },
      ]
    }

    return [
      {
        title: "Despesa total do recorte",
        headline: formatCurrency(summary.total),
        accent: null,
        accentClass: "",
        footer: "Soma de todos os títulos após aplicar o período",
        featured: true,
      },
      {
        title: "Centro mais custoso do recorte",
        headline: costlyCenters[0]?.name || "Sem centro com gasto",
        accent: costlyCenters[0] ? formatCurrency(costlyCenters[0].totalAmount) : "--",
        accentClass: "text-rose-500",
        footer: "Centro que mais consumiu verba",
        featured: false,
      },
      {
        title: "Centro menos custoso do recorte",
        headline: cheapCenters[0]?.name || "Sem centro com gasto",
        accent: cheapCenters[0] ? formatCurrency(cheapCenters[0].totalAmount) : "--",
        accentClass: "text-emerald-600",
        footer: "Menor custo entre centros com lançamento",
        featured: false,
      },
      {
        title: "Categoria mais custosa do recorte",
        headline: costlyCategories[0]?.name || "Sem categoria com gasto",
        accent: costlyCategories[0] ? formatCurrency(costlyCategories[0].totalAmount) : "--",
        accentClass: "text-indigo-600",
        footer: "Categoria que mais concentrou despesa",
        featured: false,
      },
      {
        title: "Categoria menos custosa do recorte",
        headline: cheapCategories[0]?.name || "Sem categoria com gasto",
        accent: cheapCategories[0] ? formatCurrency(cheapCategories[0].totalAmount) : "--",
        accentClass: "text-sky-600",
        footer: "Categoria mais leve dentro do filtro",
        featured: false,
      },
      {
        title: "Títulos financeiros analisados",
        headline: String(summary.payableCount),
        accent: formatCurrency(summary.pending),
        accentClass: "text-amber-600",
        footer: "Quantidade de títulos e saldo aberto",
        featured: false,
      },
    ]
  }, [centerFilter, cheapCategories, cheapCenters, costlyCategories, costlyCenters, selectedCenterData, selectedCenterMetric, summary])

  const rankingCards = [
    { title: "Centros com maior custo", desc: "Centros que mais consumiram verba no recorte.", rows: costlyCenters.slice(0, 5), color: "text-rose-600", Icon: TrendingUp },
    { title: "Centros com menor custo", desc: "Centros com menor gasto entre os que tiveram lançamento.", rows: cheapCenters.slice(0, 5), color: "text-emerald-600", Icon: TrendingDown },
    { title: "Categorias mais custosas", desc: "Categorias que mais concentraram despesas.", rows: costlyCategories.slice(0, 5), color: "text-indigo-600", Icon: Layers3 },
    { title: "Categorias mais econômicas", desc: "Categorias com menor custo dentro do recorte.", rows: cheapCategories.slice(0, 5), color: "text-sky-600", Icon: Wallet },
  ]

  const openEdit = (center?: Center) => {
    if (!center) { setSelectedCenter(null); setForm(emptyForm) }
    else { setSelectedCenter(center); setForm({ id: center.id, code: center.code || "", name: center.name || "", description: center.description || "", categoryIds: center.financialCategories?.map(category => category.id) || [], isActive: Boolean(center.isActive) }) }
    setShowDialog(true)
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    try { await saveCostCenter(form); setShowDialog(false); toast({ title: "Sucesso", description: "Centro de custo salvo com sucesso." }); router.refresh() }
    catch (error: any) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }) }
    finally { setLoading(false) }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try { await toggleCostCenterStatus(id, currentStatus); toast({ title: "Status alterado" }); router.refresh() }
    catch (error: any) { toast({ title: "Erro ao alterar", description: error.message, variant: "destructive" }) }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-1 font-outfit">
      <PageHeader 
        title="Centros de Custo"
        subtitle="Análise de custos por unidade, categorias e períodos específicos."
        icon={<Target className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex flex-wrap gap-4">
            <Link href="/financeiro/dashboard">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Link href="/financeiro/categorias-financeiras">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <FolderCog className="h-4 w-4" /> Categorias
              </Button>
            </Link>
            <Button 
              onClick={() => openEdit()}
              className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]"
            >
              <PlusCircle className="h-4 w-4" /> Novo Centro
            </Button>
          </div>
        }
      />

      {/* Filtros e Analise */}
      <div className="rounded-[2.5rem] bg-white p-8 shadow-lahomes border border-slate-100/50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Parâmetros de Análise</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">Refine sua Visão</h3>
          </div>
          <Badge className="rounded-full bg-slate-900 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-slate-900/10">
            {summary.payableCount} títulos identificados
          </Badge>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr_0.65fr]">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Centro de Gasto</Label>
            <select 
              value={centerFilter} 
              onChange={event => setCenterFilter(event.target.value)} 
              className="h-14 w-full rounded-full border border-slate-100 bg-slate-50/50 px-6 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
            >
              <option value="all">Todos os centros de custo</option>
              {dashboard.centers.map(center => (
                <option key={center.id} value={center.id}>{center.name} ({center.code})</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Período de Referência</Label>
            <Input 
              type="month" 
              value={periodInput} 
              onChange={event => setPeriodInput(event.target.value)} 
              className="h-14 rounded-full border-slate-100 bg-slate-50/50 text-sm font-bold px-6 focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          <div className="flex items-end">
            <Button 
              type="button" 
              className="w-full h-14 rounded-full bg-slate-950 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-950/20 hover:bg-slate-900 transition-all" 
              onClick={() => updatePeriod(periodInput)} 
              disabled={isPending || !/^\d{4}-\d{2}$/.test(periodInput)}
            >
              {isPending ? "Processando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={query} 
              onChange={event => setQuery(event.target.value)} 
              placeholder="Buscar por título, código ou categoria..." 
              className="h-14 rounded-full border-slate-100 bg-slate-50/50 pl-14 text-sm font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className="h-14 rounded-full border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm" 
            onClick={() => updatePeriod(shiftPeriod(selectedPeriod, -1))}
          >
            Mês Anterior
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="h-14 rounded-full border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm" 
            onClick={() => { setQuery(""); setCenterFilter("all") }}
          >
            Limpar Filtros
          </Button>
        </div>

        <div className="mt-8 rounded-[2rem] border border-primary/10 bg-primary/5 px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white text-primary shadow-lg shadow-primary/10 border border-primary/5">
                <CalendarRange className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">Análise Temporal Ativa</p>
                <p className="mt-1 text-2xl font-black uppercase text-slate-900 italic tracking-tight">{periodLabel(selectedPeriod)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                {centerFilter === "all" ? `${costlyCenters.length} unidades com custo` : `${selectedCenterData?.code || "CENTRO"} em destaque`}
              </Badge>
              <Badge className="rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                {costlyCategories.length} categorias em uso
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Metricas Rapidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card, idx) => card.featured ? (
          <div key={idx} className="group relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20 transition-all hover:scale-[1.02]">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all" />
            <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{card.title}</p>
            <p className={cn(
              "relative z-10 mt-6 font-outfit font-black italic tracking-tighter text-white transition-all",
              card.headline.length > 20 ? "text-xl" : card.headline.length > 15 ? "text-2xl" : card.headline.length > 10 ? "text-3xl" : "text-4xl"
            )}>{card.headline}</p>
            <div className="relative z-10 mt-6 flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{card.footer}</p>
            </div>
          </div>
        ) : (
          <div key={idx} className="group rounded-[2.5rem] bg-white p-8 shadow-lahomes border border-slate-100/50 transition-all hover:shadow-xl hover:shadow-slate-200/50 flex flex-col justify-between h-full">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 group-hover:text-primary transition-colors">{card.title}</p>
              <p className={cn(
                "mt-6 font-outfit text-3xl font-black italic tracking-tighter leading-none transition-transform group-hover:translate-x-1",
                card.accentClass
              )}>
                {card.accent || "--"}
              </p>
            </div>
            
            <div className="mt-8">
              <p className={cn(
                "font-black uppercase tracking-widest text-slate-900 leading-tight transition-all",
                card.headline.length > 20 ? "text-[10px]" : "text-[11px]"
              )}>
                {card.headline}
              </p>
              <p className="mt-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-50 pt-4">
                {card.footer}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Tabela de Custos */}
        <div className="overflow-hidden rounded-[2.5rem] bg-white p-4 shadow-lahomes border border-slate-100/50">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-6 pt-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Detalhamento por Unidade</p>
              <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900 italic">Despesas Operacionais</h3>
            </div>
            <Badge className="rounded-full bg-slate-50 border border-slate-200 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {centerMetrics.length} centros visíveis
            </Badge>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-slate-50 bg-slate-50/30">
            <Table>
              <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Centro / identificador</TableHead>
                  <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Categorias Associadas</TableHead>
                  <TableHead className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Total Período</TableHead>
                  <TableHead className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                  <TableHead className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Gestão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centerMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                          <Target className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-700">Nenhum dado para este recorte</p>
                        <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-wider">Ajuste os filtros para carregar mais informações.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  centerMetrics.map(metric => {
                    const center = dashboard.centers.find(item => item.id === metric.id)
                    return (
                      <TableRow key={metric.id} className="group border-slate-50/50 transition-colors hover:bg-white active:bg-slate-50">
                        <TableCell className="px-8 py-6">
                          <div className="flex items-start gap-4">
                            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                              <Target className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase tracking-tight text-slate-800">{metric.name}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">{metric.code || "S/C"}</span>
                                <span className="text-[10px] font-bold text-slate-400">• {metric.payableCount} títulos</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6 min-w-[200px]">
                          <div className="flex flex-wrap gap-2">
                            {center?.financialCategories?.length ? (
                              center.financialCategories.slice(0, 3).map(category => (
                                <Badge 
                                  key={category.id} 
                                  variant="outline" 
                                  className={cn(
                                    "rounded-full border-none bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600",
                                    category.code?.startsWith("CC_") && "bg-indigo-50 text-indigo-700 font-bold"
                                  )}
                                >
                                  {category.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Nenhuma categoria</span>
                            )}
                            {(center?.financialCategories?.length || 0) > 3 && (
                                <span className="text-[10px] font-black text-slate-400">+{center!.financialCategories!.length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-6 text-center">
                          <p className="text-sm font-black italic tracking-tighter text-rose-500 group-hover:scale-105 transition-transform">{formatCurrency(metric.totalAmount)}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Aberto: {formatCurrency(metric.pendingAmount)}</p>
                        </TableCell>
                        <TableCell className="py-6 text-center">
                          <Badge className={cn(
                            "rounded-full border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm",
                            metric.isActive 
                              ? "bg-emerald-50 text-emerald-600" 
                              : "bg-slate-100 text-slate-400"
                          )}>
                            {metric.isActive ? "Operacional" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-10 w-10 rounded-[1.2rem] bg-white shadow-sm border border-slate-100 hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-500" 
                              onClick={() => openEdit(center || undefined)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className={cn(
                                "h-10 w-10 rounded-[1.2rem] bg-white shadow-sm border border-slate-100 transition-all",
                                metric.isActive ? "hover:bg-rose-500 hover:text-white hover:border-rose-500 text-rose-500" : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-emerald-500"
                              )}
                              onClick={() => toggleStatus(metric.id, Boolean(metric.isActive))}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Rankings e Comparativos */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          {rankingCards.map(({ title, desc, rows, color, Icon }, cardIdx) => (
            <div key={cardIdx} className="group rounded-[2.5rem] bg-white p-8 shadow-lahomes border border-slate-100/50 transition-all hover:shadow-xl hover:translate-y-[-4px]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                <div>
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.24em] transition-colors", color)}>Visões Executivas</p>
                  <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">{title}</h3>
                  <p className="mt-2 text-sm text-slate-500 font-medium">{desc}</p>
                </div>
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 transition-all group-hover:scale-110", color)}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-3">
                {rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 px-6 py-10 text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Dados insuficientes</p>
                  </div>
                ) : (
                  rows.map((row, index) => (
                    <div key={`${cardIdx}-${row.id}`} className="group/item flex items-center justify-between gap-4 rounded-[1.8rem] border border-slate-100 bg-slate-50/50 px-5 py-4 transition-all hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]">
                      <div className="min-w-0 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-slate-900 shadow-sm border border-slate-100 group-hover/item:bg-slate-950 group-hover/item:text-white transition-colors">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black uppercase tracking-tight text-slate-800">{row.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mt-0.5">{row.code} | {row.payableCount} Títulos</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("text-base font-black italic tracking-tighter leading-none", color)}>{formatCurrency(row.totalAmount)}</p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400 mt-2">Saldo: {formatCurrency(row.pendingAmount)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Cadastro */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none p-0 shadow-2xl bg-white animate-in zoom-in-95 duration-200">
          <div className="bg-slate-950 px-10 py-8 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-16 -mt-16" />
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="font-outfit text-2xl font-black uppercase italic leading-none tracking-tight">
                    {selectedCenter ? "Editar Centro" : "Novo Centro"}
                  </DialogTitle>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">SPA DO COLCHÃO • Gestão de Custos</p>
                </div>
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={save} className="p-10 space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Identificador Único (Código)</Label>
                <Input 
                  className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold uppercase text-slate-900 focus:ring-2 focus:ring-primary transition-all" 
                  value={form.code} 
                  onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })} 
                  placeholder="EX: ADM-01" 
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nome Operacional</Label>
                <Input 
                  required 
                  className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-primary transition-all" 
                  value={form.name} 
                  onChange={event => setForm({ ...form, name: event.target.value })} 
                  placeholder="Ex: Administrativo" 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 text-center block">Notas e Observações</Label>
              <textarea 
                rows={3} 
                className="w-full rounded-[2rem] border-none bg-slate-50 px-8 py-6 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary transition-all resize-none" 
                value={form.description} 
                onChange={event => setForm({ ...form, description: event.target.value })} 
                placeholder="Descreva quando utilizar este centro de custo..." 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classificações Financeiras Associadas</Label>
                <Badge variant="outline" className="rounded-full border-slate-100 bg-slate-50 text-[9px] font-black text-slate-400 uppercase">
                  {form.categoryIds.length} selecionadas
                </Badge>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-[2rem] bg-slate-50 p-4 border border-slate-100 pr-2">
                {categories.map(category => (
                  <label 
                    key={category.id} 
                    className={cn(
                        "flex cursor-pointer items-center justify-between gap-4 rounded-2xl px-6 py-4 transition-all shadow-sm group/cat",
                        form.categoryIds.includes(category.id) ? "bg-white border border-primary/20" : "bg-white/50 hover:bg-white border border-transparent"
                    )}
                  >
                    <div className="min-w-0">
                      <p className={cn(
                          "text-[11px] font-black uppercase tracking-widest transition-colors",
                          form.categoryIds.includes(category.id) ? "text-primary" : "text-slate-600"
                      )}>{category.name}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                        {category.code} {category.isActive === false ? "• INATIVA" : ""}
                      </p>
                    </div>
                    <Checkbox 
                      checked={form.categoryIds.includes(category.id)} 
                      onCheckedChange={() => setForm(prev => ({ 
                        ...prev, 
                        categoryIds: prev.categoryIds.includes(category.id) 
                          ? prev.categoryIds.filter(id => id !== category.id) 
                          : [...prev.categoryIds, category.id] 
                      }))} 
                      className="rounded-full border-slate-200"
                    />
                  </label>
                ))}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center px-6">
                A categoria espelhada do próprio centro é vinculada automaticamente pelo sistema.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-[2rem] bg-slate-50 px-8 py-5 border border-slate-100">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Disponibilidade Operacional</p>
                <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unidades inativas não permitem novos lançamentos.</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className={cn(
                  "rounded-full h-10 px-6 text-[9px] font-black uppercase tracking-[0.1em] transition-all",
                  form.isActive 
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-700/5 hover:bg-emerald-100" 
                    : "border-slate-200 bg-white text-slate-400 opacity-60 hover:opacity-100"
                )} 
                onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
              >
                {form.isActive ? "Unidade Ativa" : "Unidade Suspensa"}
              </Button>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-50 gap-4 flex-col sm:flex-row">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowDialog(false)}
                    className="h-14 rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex-1 order-2 sm:order-1"
                >
                    Descartar
                </Button>
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-14 rounded-full bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary/90 shadow-2xl shadow-primary/20 flex-1 order-1 sm:order-2"
                >
                    {loading ? "Salvando..." : selectedCenter ? "Atualizar Unidade" : "Efetivar Cadastro"}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
