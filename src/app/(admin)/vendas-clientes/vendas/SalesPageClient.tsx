"use client"

import { useState } from "react"
import Link from "next/link"
import { SalesSummary } from "@/components/vendas/SalesSummary"
import { SalesTable } from "@/components/vendas/SalesTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  LayoutGrid,
  List,
  Tags,
  ArrowRight,
  BarChart3,
  Goal,
  MapPinned,
  DollarSign,
  ClipboardList,
  Users,
  Wallet,
  Sparkles,
  CheckCircle2,
  Clock3,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SalesPageClientProps {
  initialSales: any[]
  summary: {
    todayTotal: number
    monthTotal: number
    ticketMedio: number
    pendingTotal: number
    paidTotal: number
    cancelledCount: number
  }
  dashboard: {
    referencePeriod: string
    monthConfirmedCount: number
    draftCount: number
    pendingReceivablesCount: number
    monthlyGoals: {
      sellers: number
      targetAmount: number
      achievedAmount: number
    }
    topSellers: Array<{
      id: string
      name: string
      total: number
      count: number
      avgTicket: number
    }>
    topLeadSources: Array<{
      id: string
      name: string
      total: number
      count: number
    }>
    orderPipeline: {
      sold: number
      inProduction: number
      delivered: number
      finalized: number
      cancelled: number
    }
    commissions: {
      pendingAmount: number
      pendingCount: number
      approvedAmount: number
      approvedCount: number
      paidAmount: number
      paidCount: number
    }
  }
}

const quickLinks = [
  {
    title: "Metas comerciais",
    description: "Acompanhe alvo, ranking e evolução da equipe.",
    href: "/vendas-clientes/metas",
    icon: Goal,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "Origens de venda",
    description: "Entenda canais, captação e conversão por origem.",
    href: "/vendas-clientes/origens-de-venda",
    icon: MapPinned,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    title: "Central de comissões",
    description: "Valide pendências e acompanhe pagamentos.",
    href: "/vendas-clientes/comissoes",
    icon: DollarSign,
    tone: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    title: "Pedidos operacionais",
    description: "Acompanhe a central, o kanban e o ritmo dos pedidos.",
    href: "/vendas-clientes/pedidos",
    icon: ClipboardList,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    title: "Base de clientes",
    description: "Consulte histórico, carteira e relacionamento.",
    href: "/vendas-clientes/clientes",
    icon: Users,
    tone: "bg-rose-50 text-rose-700 border-rose-100",
  },
]

export function SalesPageClient({ initialSales, summary, dashboard }: SalesPageClientProps) {
  const [sales] = useState(initialSales)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  const goalProgress =
    dashboard.monthlyGoals.targetAmount > 0
      ? Math.min(
          100,
          (dashboard.monthlyGoals.achievedAmount / dashboard.monthlyGoals.targetAmount) * 100
        )
      : 0

  const monthTotalLabel = formatCurrency(summary.monthTotal)
  const monthTotalSizeClass =
    monthTotalLabel.length >= 15
      ? "text-[clamp(1.7rem,2.3vw,2.35rem)]"
      : monthTotalLabel.length >= 12
        ? "text-[clamp(1.95rem,2.7vw,2.7rem)]"
        : "text-[clamp(2.2rem,3vw,3.1rem)]"

  const pipelineCards = [
    {
      label: "Vendidos",
      value: dashboard.orderPipeline.sold,
      tone: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Em produção",
      value: dashboard.orderPipeline.inProduction,
      tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
      label: "Entregues",
      value: dashboard.orderPipeline.delivered,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "Finalizados",
      value: dashboard.orderPipeline.finalized,
      tone: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ]

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.number && sale.number.includes(searchTerm))
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <PageHeader
        title="Dashboard Comercial"
        subtitle="Visão executiva do setor com vendas, pedidos, origens, metas e comissões concentradas em um único painel."
        icon={<Tags className="h-8 w-8" />}
        actionsWrap
        actions={
          <>
            <Link href="/vendas-clientes/metas">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <Goal className="h-4 w-4" /> Metas
              </Button>
            </Link>
            <Link href="/vendas-clientes/origens-de-venda">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <MapPinned className="h-4 w-4" /> Origens
              </Button>
            </Link>
            <Button
              variant="outline"
              className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
            >
              <Download className="h-4 w-4" /> Exportar
            </Button>
            <Link href="/pdv">
              <Button className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]">
                <Plus className="h-4 w-4" /> Nova Venda
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 2xl:grid-cols-[1.7fr_1fr] gap-8">
        <div className="rounded-[2.75rem] overflow-hidden border border-slate-900 bg-slate-950 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.85)]">
          <div className="p-8 md:p-10 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="min-w-0 max-w-[42rem] space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Competência {dashboard.referencePeriod}
                </div>
                <div className="min-w-0 space-y-3">
                  <h2 className="max-w-[12ch] break-words text-3xl leading-[0.95] md:text-4xl font-black uppercase italic tracking-tight font-outfit">
                    Pulso Comercial do Mês
                  </h2>
                  <p className="max-w-3xl text-sm text-slate-300 leading-relaxed">
                    O painel consolida produção de vendas, carteira em aberto, metas do time e andamento operacional dos pedidos para decisão rápida.
                  </p>
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col items-start gap-3 lg:w-auto lg:min-w-[20rem] lg:items-end xl:min-w-[23rem]">
                <div className="min-w-[16rem] w-fit max-w-full rounded-[1.8rem] border border-white/10 bg-white/5 p-4 sm:min-w-[18rem] sm:p-5">
                  <p className="max-w-[11rem] break-words text-[10px] leading-relaxed font-black uppercase tracking-[0.24em] text-slate-400">
                    Faturamento do mês
                  </p>
                  <p
                    className={`mt-3 max-w-full whitespace-nowrap leading-none font-black italic tracking-[-0.04em] font-outfit ${monthTotalSizeClass}`}
                  >
                    {monthTotalLabel}
                  </p>
                </div>
                <div className="min-w-[16rem] w-full max-w-full rounded-[1.8rem] border border-white/10 bg-white/5 p-4 sm:min-w-[18rem] sm:p-5 lg:w-[18rem]">
                  <p className="max-w-[11rem] break-words text-[10px] leading-relaxed font-black uppercase tracking-[0.24em] text-slate-400">
                    Vendas confirmadas
                  </p>
                  <p className="mt-3 max-w-full whitespace-nowrap text-[clamp(1.35rem,2vw,2.05rem)] leading-none font-black italic tracking-[-0.04em] font-outfit">
                    {dashboard.monthConfirmedCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                      Maior vendedor
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {dashboard.topSellers[0]?.name || "Sem vendas no mês"}
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-cyan-200" />
                </div>
                <p className="mt-3 text-sm text-cyan-100">
                  {dashboard.topSellers[0]
                    ? `${formatCurrency(dashboard.topSellers[0].total)} em ${dashboard.topSellers[0].count} vendas`
                    : "Ainda não há performance consolidada nesta competência."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-violet-400/20 bg-violet-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">
                      Origem líder
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {dashboard.topLeadSources[0]?.name || "Sem origem líder"}
                    </p>
                  </div>
                  <MapPinned className="h-5 w-5 text-violet-200" />
                </div>
                <p className="mt-3 text-sm text-violet-100">
                  {dashboard.topLeadSources[0]
                    ? `${dashboard.topLeadSources[0].count} vendas e ${formatCurrency(dashboard.topLeadSources[0].total)} gerados`
                    : "Nenhuma origem gerou vendas confirmadas no período."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
                      Carteira em aberto
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {dashboard.pendingReceivablesCount} vendas
                    </p>
                  </div>
                  <Wallet className="h-5 w-5 text-amber-200" />
                </div>
                <p className="mt-3 text-sm text-amber-100">
                  {formatCurrency(summary.pendingTotal)} ainda dependem de baixa financeira.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Meta consolidada da equipe
                  </p>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <span className="text-3xl font-black italic font-outfit tracking-tight">
                      {formatCurrency(dashboard.monthlyGoals.achievedAmount)}
                    </span>
                    <span className="text-sm text-slate-400">
                      de {formatCurrency(dashboard.monthlyGoals.targetAmount)}
                    </span>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-3xl font-black italic font-outfit tracking-tight text-emerald-300">
                    {goalProgress.toFixed(1)}%
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    {dashboard.monthlyGoals.sellers} vendedores com meta cadastrada
                  </p>
                </div>
              </div>
              <div className="mt-5 h-3 rounded-full bg-white/10 p-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Acessos rápidos
            </p>
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
              Gestão do setor
            </h3>
            <p className="text-sm text-slate-500">
              Use estes atalhos para abrir rapidamente metas, canais, comissões e operação.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {quickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between gap-4 rounded-[1.8rem] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${link.tone}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight">{link.title}</p>
                    <p className="text-xs opacity-80 leading-relaxed">{link.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Situação rápida
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rascunhos de venda</span>
                <span className="font-black text-primary">{dashboard.draftCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Comissões pendentes</span>
                <span className="font-black text-amber-600">{dashboard.commissions.pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Comissões aprovadas</span>
                <span className="font-black text-indigo-600">{dashboard.commissions.approvedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Comissões pagas</span>
                <span className="font-black text-emerald-600">{dashboard.commissions.paidCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SalesSummary stats={summary} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Fluxo operacional
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
                Pedidos em andamento
              </h3>
            </div>
            <ClipboardList className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {pipelineCards.map(card => (
              <div key={card.label} className={`rounded-[1.8rem] border p-4 ${card.tone}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.22em]">{card.label}</p>
                <p className="mt-3 text-3xl font-black italic tracking-tight font-outfit">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Ranking do mês
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
                Vendedores em destaque
              </h3>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-6 space-y-3">
            {dashboard.topSellers.length === 0 && (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                Nenhuma venda com vendedor atribuído foi confirmada nesta competência.
              </div>
            )}
            {dashboard.topSellers.map((seller, index) => (
              <div key={seller.id} className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-black">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-tight text-primary">
                        {seller.name}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {seller.count} vendas | ticket {formatCurrency(seller.avgTicket)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-600 whitespace-nowrap">
                    {formatCurrency(seller.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Origens mais fortes
                </p>
                <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
                  Canais do período
                </h3>
              </div>
              <MapPinned className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-6 space-y-3">
              {dashboard.topLeadSources.length === 0 && (
                <div className="rounded-[1.8rem] border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                  Nenhuma origem gerou venda confirmada neste mês.
                </div>
              )}
              {dashboard.topLeadSources.map(source => (
                <div key={source.id} className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-tight text-primary">
                        {source.name}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {source.count} vendas convertidas
                      </p>
                    </div>
                    <span className="text-sm font-black text-sky-600 whitespace-nowrap">
                      {formatCurrency(source.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Comissões do mês
                </p>
                <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
                  Status financeiro
                </h3>
              </div>
              <DollarSign className="h-5 w-5 text-slate-300" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-[1.6rem] border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-black text-amber-700">Pendentes</span>
                </div>
                <span className="text-sm font-black text-amber-700">
                  {formatCurrency(dashboard.commissions.pendingAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1.6rem] border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-black text-indigo-700">Aprovadas</span>
                </div>
                <span className="text-sm font-black text-indigo-700">
                  {formatCurrency(dashboard.commissions.approvedAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1.6rem] border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-black text-emerald-700">Pagas</span>
                </div>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(dashboard.commissions.paidAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
            <Input
              placeholder="Buscar por cliente ou número..."
              className="pl-12 rounded-2xl border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto font-bold uppercase tracking-widest text-[10px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 rounded-2xl border-slate-100 h-12">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-50 shadow-xl font-sans">
                <SelectItem value="all" className="rounded-xl">
                  Todos os Status
                </SelectItem>
                <SelectItem value="CONFIRMED" className="rounded-xl">
                  Confirmada
                </SelectItem>
                <SelectItem value="DRAFT" className="rounded-xl">
                  Rascunho
                </SelectItem>
                <SelectItem value="CANCELLED" className="rounded-xl">
                  Cancelada
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="rounded-2xl h-12 w-12 p-0 border-slate-100 hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <div className="flex bg-slate-100/50 p-1.5 rounded-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl bg-white shadow-sm border border-slate-50"
            >
              <List className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-primary transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-2xl text-slate-400 hover:text-primary border-slate-100 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Últimos lançamentos
          </p>
          <h3 className="mt-2 text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
            Vendas recentes do setor
          </h3>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
          <SalesTable sales={filteredSales} />
        </div>
      </div>
    </div>
  )
}
