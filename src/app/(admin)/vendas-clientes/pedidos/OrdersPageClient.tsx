"use client"

import { OrdersSummary } from "@/components/pedidos/OrdersSummary"
import { OrdersTable } from "@/components/pedidos/OrdersTable"
import { OrderKanban } from "@/components/pedidos/OrderKanban"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Gauge,
  RefreshCw,
  Search,
  Timer,
  Truck,
  Users,
  ArrowLeft,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import type { UserRoleName } from "@/lib/order-flow"

interface OrdersPageClientProps {
  initialOrders: any[]
  viewMode?: "full" | "sales" | "kanban-only"
  currentUserRole: UserRoleName | null
  kanbanMode: "view" | "full" | "production_only"
  portfolioNotice?: string | null
  summary: {
    sold: number
    waitingPreparation: number
    inProduction: number
    waitingDelivery: number
    delivered: number
    finalized: number
    delayed: number
    cancelled: number
  }
  dashboard: {
    metrics: {
      activeCount: number
      delayedCount: number
      backlogValue: number
      avgProductionDays: number
      avgCycleDays: number
      onTimeRate: number
      finalizedThisMonth: number
      deliveredThisMonth: number
      recentTransitionsCount: number
      bottleneckLabel: string
      bottleneckCount: number
    }
    sellerRanking: Array<{
      id: string
      name: string
      activeCount: number
      completedCount: number
      delayedCount: number
      backlogValue: number
    }>
    stageAging: Array<{
      status: string
      label: string
      count: number
      averageDays: number
      oldestDays: number
      color: string
    }>
    recentTransitions: Array<{
      id: string
      orderId: string
      orderCode: string | null
      customerName: string
      sellerName: string
      label: string
      changedAt: Date
      transitionSource: string
      changedByName: string
    }>
  }
}

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "SOLD", label: "Vendido" },
  { value: "WAITING_PREPARATION", label: "Aguardando preparo" },
  { value: "IN_PRODUCTION", label: "Em produção" },
  { value: "WAITING_DELIVERY", label: "Aguardando entrega" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "FINALIZED", label: "Finalizado" },
  { value: "CANCELLED", label: "Cancelado" },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDays(value: number) {
  if (!value) return "0,0 dia"
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} dia`
}

function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function formatTransitionDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function OrdersPageClient({
  initialOrders,
  viewMode = "full",
  currentUserRole,
  kanbanMode,
  portfolioNotice,
  summary,
  dashboard,
}: OrdersPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredOrders = initialOrders.filter((order) => {
    const matchesSearch =
      order.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.code && order.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.sale.number && String(order.sale.number).includes(searchTerm))

    const matchesStatus = statusFilter === "all" || order.currentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const isSalesView = viewMode === "sales"
  const isKanbanOnlyView = viewMode === "kanban-only"

  if (isSalesView || isKanbanOnlyView) {
    return (
      <div className={`animate-in pb-10 duration-700 fade-in max-w-full overflow-hidden ${isKanbanOnlyView ? 'px-8 pt-8 space-y-12' : 'space-y-8'}`}>
        <PageHeader
          title={isKanbanOnlyView ? "Kanban Operacional" : "Central Comercial de Pedidos"}
          subtitle={
            isKanbanOnlyView
              ? "Visão focada no quadro de produção e entrega, com movimentação restrita ao perfil conectado."
              : "Leitura enxuta para vendedores e supervisão comercial, com fila de pedidos e kanban integrado."
          }
          icon={<ClipboardList className="h-8 w-8" />}
          actionsWrap
          actions={
            <>
              <Button
                variant="outline"
                className="h-12 rounded-full border-slate-200 bg-white px-6 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-slate-50"
                onClick={() => window.location.href = "/vendas-clientes/pedidos"}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Central
              </Button>
              <Button
                className="h-12 rounded-full bg-primary px-8 text-xs font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
              </Button>
            </>
          }
        />

        {portfolioNotice ? (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {portfolioNotice}
          </div>
        ) : null}

        <div className="flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-slate-50 bg-white p-6 shadow-lahomes xl:flex-row">
          <div className="flex w-full flex-col items-center gap-4 md:flex-row xl:w-auto">
            <div className="group relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 font-bold text-slate-400 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Buscar por cliente, pedido ou venda..."
                className="h-12 rounded-2xl border-slate-100 pl-12 text-sm font-medium focus-visible:ring-primary"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-full rounded-2xl border-slate-100 md:w-60">
                <SelectValue placeholder="Status operacional" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-50 font-sans shadow-xl">
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-xl">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            {filteredOrders.length} pedidos no recorte atual
          </div>
        </div>


        {!isKanbanOnlyView ? (
          <section id="fila-detalhada" className="space-y-4">
            <div className="px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Fila detalhada
              </p>
              <h3 className="mt-2 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Leitura individual dos pedidos
              </h3>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-50 bg-white shadow-lahomes">
              <OrdersTable orders={filteredOrders} />
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="px-1">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Quadro de movimentação
              </p>
              <h3 className="mt-2 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Fluxo operacional de pedidos
              </h3>
            </div>
            <OrderKanban 
              initialOrders={filteredOrders} 
              currentUserRole={currentUserRole}
              kanbanMode={kanbanMode}
            />
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="animate-in space-y-10 pb-10 duration-700 fade-in">
      <PageHeader
        title="Central de Pedidos"
        subtitle="Dashboard operacional do fluxo de pedidos com leitura de gargalos, tempo médio por etapa e ranking de carteira."
        icon={<ClipboardList className="h-8 w-8" />}
        actionsWrap
        actions={
          <>
            <Button
              variant="outline"
              className="h-12 rounded-full border-slate-200 px-6 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-slate-50"
              onClick={() =>
                document.getElementById("fila-detalhada")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <ClipboardList className="mr-2 h-4 w-4" /> Ver Fila
            </Button>
            <Button
              className="h-12 rounded-full bg-primary px-8 text-xs font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
          </>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-[2.75rem] border border-slate-900 bg-slate-950 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.85)]">
          <div className="space-y-8 p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[42rem] space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  <Activity className="h-3.5 w-3.5" />
                  Fluxo operacional em tempo real
                </div>
                <div className="space-y-3">
                  <h2 className="max-w-[14ch] break-words font-outfit text-3xl font-black uppercase italic leading-[0.95] tracking-tight md:text-4xl">
                    Produção, entrega e kanban no mesmo painel
                  </h2>
                  <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                    Acompanhe o ritmo da operação, identifique gargalos e monitore o fluxo de pedidos sem sair da central.
                  </p>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[23rem]">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Tempo médio de produção
                  </p>
                  <p className="mt-3 font-outfit text-[2rem] font-black italic tracking-tight text-white">
                    {formatDays(dashboard.metrics.avgProductionDays)}
                  </p>
                </div>
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Ciclo médio do pedido
                  </p>
                  <p className="mt-3 font-outfit text-[2rem] font-black italic tracking-tight text-white">
                    {formatDays(dashboard.metrics.avgCycleDays)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
                      Gargalo atual
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {dashboard.metrics.bottleneckLabel}
                    </p>
                  </div>
                  <Gauge className="h-5 w-5 text-cyan-200" />
                </div>
                <p className="mt-3 text-sm text-cyan-100">
                  {dashboard.metrics.bottleneckCount} pedidos concentram o maior peso do fluxo.
                </p>
              </div>

              <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
                      Pedidos ativos
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {dashboard.metrics.activeCount} em carteira
                    </p>
                  </div>
                  <Boxes className="h-5 w-5 text-amber-200" />
                </div>
                <p className="mt-3 text-sm text-amber-100">
                  {formatCurrency(dashboard.metrics.backlogValue)} em valor ainda rodando no fluxo.
                </p>
              </div>

              <div className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                      Risco operacional
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {dashboard.metrics.delayedCount} atrasados
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-rose-200" />
                </div>
                <p className="mt-3 text-sm text-rose-100">
                  Pedidos acima da data prometida e ainda não encerrados.
                </p>
              </div>

              <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                      Entrega no prazo
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {formatPercent(dashboard.metrics.onTimeRate)}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                </div>
                <p className="mt-3 text-sm text-emerald-100">
                  Taxa de cumprimento frente ao prazo prometido ao cliente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.75rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Saúde da operação
            </p>
            <h3 className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
              Fechamento da competência
            </h3>
            <p className="text-sm text-slate-500">
              Leitura rápida do volume entregue, pedidos fechados e pulsação recente do kanban.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-[1.8rem] border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-black text-emerald-700">Entregues no mês</span>
              </div>
              <span className="text-sm font-black text-emerald-700">
                {dashboard.metrics.deliveredThisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1.8rem] border border-primary/10 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-black text-primary">Finalizados no mês</span>
              </div>
              <span className="text-sm font-black text-primary">
                {dashboard.metrics.finalizedThisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[1.8rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Timer className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-black text-slate-700">Movimentos recentes</span>
              </div>
              <span className="text-sm font-black text-slate-700">
                {dashboard.metrics.recentTransitionsCount}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Etapas mais carregadas
            </p>
            <div className="mt-4 space-y-3">
              {dashboard.stageAging.map((stage) => (
                <div
                  key={stage.status}
                  className="rounded-[1.5rem] border border-white bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-1.5 rounded-full ${stage.color}`} />
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-primary">
                          {stage.label}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {stage.count} pedidos | média {formatDays(stage.averageDays)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      pico {formatDays(stage.oldestDays)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <OrdersSummary stats={summary} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Ranking operacional
              </p>
              <h3 className="mt-2 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Vendedores com mais carteira
              </h3>
            </div>
            <Users className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-6 space-y-3">
            {dashboard.sellerRanking.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                Nenhum vendedor com pedidos em andamento nesta leitura.
              </div>
            ) : (
              dashboard.sellerRanking.map((seller, index) => (
                <div
                  key={seller.id}
                  className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-primary">
                          {seller.name}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {seller.activeCount} ativos | {seller.completedCount} concluídos em 30 dias
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">
                        {formatCurrency(seller.backlogValue)}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                        {seller.delayedCount} atrasados
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Leitura do fluxo
              </p>
              <h3 className="mt-2 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Ritmo operacional
              </h3>
            </div>
            <Gauge className="h-5 w-5 text-slate-300" />
          </div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Valor do backlog
              </p>
              <p className="mt-3 font-outfit text-3xl font-black italic tracking-tight text-primary">
                {formatCurrency(dashboard.metrics.backlogValue)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.8rem] border border-sky-100 bg-sky-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-sky-700">
                  Ciclo médio
                </p>
                <p className="mt-3 text-2xl font-black italic tracking-tight text-sky-700">
                  {formatDays(dashboard.metrics.avgCycleDays)}
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">
                  Produção média
                </p>
                <p className="mt-3 text-2xl font-black italic tracking-tight text-emerald-700">
                  {formatDays(dashboard.metrics.avgProductionDays)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-lahomes">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Movimentação do kanban
              </p>
              <h3 className="mt-2 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
                Últimas transições
              </h3>
            </div>
            <Activity className="h-5 w-5 text-slate-300" />
          </div>
          <div className="mt-6 space-y-3">
            {dashboard.recentTransitions.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-slate-200 p-6 text-sm text-slate-400">
                Ainda não houve movimentação registrada no quadro operacional.
              </div>
            ) : (
              dashboard.recentTransitions.map((transition) => (
                <div
                  key={transition.id}
                  className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-tight text-primary">
                        Pedido #{transition.orderCode || "---"} | {transition.customerName}
                      </p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {transition.label} | {transition.transitionSource} | {transition.changedByName}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {formatTransitionDate(transition.changedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-[2rem] border border-slate-50 bg-white p-6 shadow-lahomes xl:flex-row">
        <div className="flex w-full flex-col items-center gap-4 md:flex-row xl:w-auto">
          <div className="group relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 font-bold text-slate-400 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Buscar por cliente, pedido ou venda..."
              className="h-12 rounded-2xl border-slate-100 pl-12 text-sm font-medium focus-visible:ring-primary"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 w-full rounded-2xl border-slate-100 md:w-60">
              <SelectValue placeholder="Status operacional" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-50 font-sans shadow-xl">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-xl">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full items-center justify-end gap-3 xl:w-auto">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
            {filteredOrders.length} pedidos no recorte atual
          </div>
        </div>
      </div>


      <section id="fila-detalhada" className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Fila detalhada
          </p>
          <h3 className="mt-2 font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
            Leitura individual dos pedidos
          </h3>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-50 bg-white shadow-lahomes">
          <OrdersTable orders={filteredOrders} />
        </div>
      </section>
    </div>
  )
}
