"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { 
  Building2, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  ChevronRight,
  PlusCircle,
  PiggyBank,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Target,
} from "lucide-react"
import { FinancialCharts } from "./FinancialCharts"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"

interface DashboardContentProps {
  data: any
}

const quickLinks = [
  {
    title: "Contas Bancárias",
    description: "Gerencie saldos, extratos e conciliação de contas.",
    href: "/financeiro/contas-bancarias",
    icon: Building2,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    title: "Fechamento de Caixa",
    description: "Acompanhe aberturas, bleutes e conferência de turnos.",
    href: "/financeiro/fechamento-de-caixa",
    icon: Clock,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    title: "Formas de Pagamento",
    description: "Configure taxas, prazos e bandeiras aceitas.",
    href: "/financeiro/formas-de-pagamento",
    icon: Wallet,
    tone: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    title: "Fluxo de Caixa",
    description: "Visão detalhada de entradas e saídas por período.",
    href: "/financeiro/fluxo-de-caixa",
    icon: TrendingUp,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "Centros de Custo",
    description: "Distribua despesas por departamentos e unidades.",
    href: "/financeiro/centros-de-custo",
    icon: Target,
    tone: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    title: "Categorias",
    description: "Organize o plano de contas e DRE da empresa.",
    href: "/financeiro/categorias-financeiras",
    icon: Layers,
    tone: "bg-rose-50 text-rose-700 border-rose-100",
  },
]

export function DashboardContent({ data }: DashboardContentProps) {
  const { summary, accounts, chartData, recentTitles } = data

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 mt-6 md:mt-0">
      <PageHeader
        title="Gestão Financeira"
        subtitle="Controle de fluxo, contas bancárias, pagamentos e recebimentos concentrados em um único painel."
        icon={<Wallet className="h-8 w-8" />}
        actionsWrap
        actions={
          <>
            <Link href="/financeiro/contas-a-receber">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" /> Receber
              </Button>
            </Link>
            <Link href="/financeiro/contas-a-pagar">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <ArrowDownCircle className="h-4 w-4 text-rose-500" /> Pagar
              </Button>
            </Link>
            <Link href="/financeiro/recebimentos">
              <Button className="rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]">
                <PlusCircle className="h-4 w-4" /> Novo Recebimento
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 2xl:grid-cols-[1.7fr_1fr] gap-8">
        {/* Card Principal - Pulso Financeiro (Dark Style) */}
        <div className="rounded-[2.75rem] overflow-hidden border border-slate-900 bg-slate-950 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.85)] flex flex-col">
          {/* Top Section: Header and High-Level Metrics */}
          <div className="p-8 md:p-10 space-y-8 flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="min-w-0 max-w-[42rem] space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Consolidado Geral
                </div>
                <div className="min-w-0 space-y-3">
                  <h2 className="max-w-[12ch] break-words text-3xl leading-[0.95] md:text-4xl font-black uppercase italic tracking-tight font-outfit">
                    Pulso de Caixa Mensal
                  </h2>
                  <p className="max-w-3xl text-sm text-slate-300 leading-relaxed">
                    Visão estratégica do caixa, monitorando saldo em contas, previsibilidade de recebíveis e compromissos de pagamento.
                  </p>
                </div>
              </div>

              <div className="flex w-full min-w-0 flex-col items-start gap-3 lg:w-auto lg:min-w-[20rem] lg:items-end xl:min-w-[23rem]">
                <div className="min-w-[16rem] w-fit max-w-full rounded-[1.8rem] border border-white/10 bg-white/5 p-4 sm:min-w-[18rem] sm:p-5">
                  <p className="max-w-[11rem] break-words text-[10px] leading-relaxed font-black uppercase tracking-[0.24em] text-slate-400">
                    Saldo Total Consolidado
                  </p>
                  <p className="mt-3 max-w-full whitespace-nowrap leading-none font-black italic tracking-[-0.04em] font-outfit text-[clamp(2.2rem,3vw,3.1rem)]">
                    {formatCurrency(summary.totalBalance)}
                  </p>
                </div>
                <div className="min-w-[16rem] w-full max-w-full rounded-[1.8rem] border border-white/10 bg-white/5 p-4 sm:min-w-[18rem] sm:p-5 lg:w-[18rem]">
                  <p className="max-w-[11rem] break-words text-[10px] leading-relaxed font-black uppercase tracking-[0.24em] text-slate-400">
                    Resultado Operacional
                  </p>
                  <p className={cn(
                    "mt-3 max-w-full whitespace-nowrap text-[clamp(1.35rem,2vw,2.05rem)] leading-none font-black italic tracking-[-0.04em] font-outfit",
                    summary.operatingProfit >= 0 ? "text-cyan-300" : "text-rose-400"
                  )}>
                    {formatCurrency(summary.operatingProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section (Footer): Secondary Totals Grid */}
          <div className="bg-white/5 border-t border-white/10 p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-5 group hover:border-emerald-400/40 transition-all cursor-default">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">
                      Total a Receber
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {formatCurrency(summary.totalReceivable)}
                    </p>
                  </div>
                  <ArrowUpCircle className="h-5 w-5 text-emerald-200" />
                </div>
                <p className="mt-3 text-sm text-emerald-100 opacity-80">
                  {formatCurrency(summary.overdueReceivable)} em atraso atualmente.
                </p>
              </div>

              <div className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-5 group hover:border-rose-400/40 transition-all cursor-default">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-200">
                      Total a Pagar
                    </p>
                    <p className="mt-2 text-xl font-black uppercase tracking-tight">
                      {formatCurrency(summary.totalPayable)}
                    </p>
                  </div>
                  <ArrowDownCircle className="h-5 w-5 text-rose-200" />
                </div>
                <p className="mt-3 text-sm text-rose-100 opacity-80">
                  Compromissos para os próximos 30 dias.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Acessos Rápidos (Glassmorphism Style) */}
        <div className="rounded-[2.75rem] border border-slate-200/60 bg-white/70 backdrop-blur-md p-8 shadow-lahomes">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Acessos rápidos
            </p>
            <h3 className="text-2xl font-black uppercase italic tracking-tight text-primary font-outfit">
              Ações Úteis
            </h3>
            <p className="text-sm text-slate-500">
              Atalhos estratégicos para gestão de taxas, conciliação bancária e operação de caixa.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {quickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-[1.8rem] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  link.tone
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase tracking-tight">{link.title}</p>
                    <p className="text-[10px] opacity-80 leading-relaxed truncate">{link.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Stats Secundários (White Style) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-inter">
        {[
          {
            title: "Saldo em Contas",
            value: summary.totalBalance,
            icon: PiggyBank,
            description: "Disponível imediato",
            className: "text-primary"
          },
          {
            title: "Previsão Entrada",
            value: summary.totalReceivable,
            icon: ArrowUpCircle,
            description: "Próximas confirmações",
            className: "text-emerald-600"
          },
          {
            title: "Previsão Saída",
            value: summary.totalPayable,
            icon: ArrowDownCircle,
            description: "Próximos vencimentos",
            className: "text-rose-600"
          },
          {
            title: "Fluxo Mensal",
            value: summary.operatingProfit,
            icon: TrendingUp,
            description: "Saldo operacional",
            className: summary.operatingProfit >= 0 ? "text-primary" : "text-rose-600"
          }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lahomes rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all bg-white">
            <CardHeader className="pb-2 pt-8 px-8">
              <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-between">
                {stat.title}
                <stat.icon className={cn("h-4 w-4", stat.className)} />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className={cn("text-3xl font-black font-outfit tracking-tighter italic", stat.className)}>
                {formatCurrency(stat.value)}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <FinancialCharts data={chartData} />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Contas Bancárias */}
        <Card className="border-none shadow-lahomes rounded-[2.5rem] bg-white overflow-hidden lg:col-span-1">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-primary font-outfit flex items-center gap-3 uppercase tracking-tighter leading-none italic">
              <PiggyBank className="w-6 h-6 text-primary"/> Contas Bancárias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-4">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="p-6 rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 transition-colors group cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{acc.type === 'CASH' ? 'Espécie' : 'Banco'}</span>
                    <span className="text-[11px] font-black text-primary font-outfit italic">{formatCurrency(acc.balance)}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">{acc.name}</h4>
                </div>
              ))}
              <Link href="/financeiro/contas-bancarias" className="flex items-center justify-center p-4 rounded-full border-2 border-dashed border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all mt-4">
                Gerenciar Contas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Últimos Títulos */}
        <Card className="border-none shadow-lahomes rounded-[2.5rem] bg-white overflow-hidden lg:col-span-2">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black text-primary font-outfit flex items-center gap-3 uppercase tracking-tighter leading-none italic">
              <Clock className="w-6 h-6 text-primary"/> Movimentações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
             <div className="space-y-4">
                {recentTitles.receivables.length === 0 && recentTitles.payables.length === 0 ? (
                   <div className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sem movimentações pendentes</div>
                ) : (
                  <>
                    {[...recentTitles.receivables, ...recentTitles.payables]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 6)
                      .map((title: any, idx: number) => {
                        const isReceivable = 'customerId' in title
                        return (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                             <div className="flex items-center gap-4">
                               <div className={cn(
                                 "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                                 isReceivable ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                               )}>
                                 {isReceivable ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                               </div>
                               <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                                   {isReceivable ? 'Recebível' : 'Pagável'} • Venc. {new Date(title.dueDate).toLocaleDateString()}
                                 </p>
                                 <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight truncate max-w-[200px] md:max-w-md">
                                   {title.description}
                                 </h4>
                               </div>
                             </div>
                             <div className="text-right">
                               <p className="text-sm font-black text-primary font-outfit italic">{formatCurrency(title.amount)}</p>
                               <span className={cn(
                                 "text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full inline-block mt-1",
                                 title.status === 'RECEIVED' || title.status === 'PAID' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                               )}>
                                 {title.status}
                               </span>
                             </div>
                          </div>
                        )
                    })}
                  </>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
