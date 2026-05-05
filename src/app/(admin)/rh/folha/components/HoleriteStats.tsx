"use client"

import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Banknote, CreditCard, ReceiptText, Users } from "lucide-react"

type HoleriteStatsProps = {
  totalGross: number
  totalNet: number
  totalDeductions: number
  processedCount: number
  totalEmployees: number
}

export function HoleriteStats({
  totalGross,
  totalNet,
  totalDeductions,
  processedCount,
  totalEmployees
}: HoleriteStatsProps) {
  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  const progress = totalEmployees > 0 ? (processedCount / totalEmployees) * 100 : 0

  return (
    <section className="relative overflow-hidden rounded-[2.75rem] border-0 bg-slate-950 text-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.85)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
      
      <CardContent className="relative p-8 md:p-10">
        <div className="grid gap-8 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-100">
              Resumo Operacional de Folha
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl font-outfit text-4xl font-black uppercase italic tracking-tight md:text-5xl">
                 Processamento de holerites do periodo.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Acompanhe o fechamento financeiro, valide descontos e confirme prêmios de produtividade. 
                Sua folha gerenciada com precisão e transparência.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 rounded-full py-1.5 px-4 font-black text-[10px] uppercase tracking-widest gap-2">
                <ReceiptText className="h-3 w-3" /> {processedCount} de {totalEmployees} Holerites Gerados
              </Badge>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full py-1.5 px-4 font-black text-[10px] uppercase tracking-widest gap-2">
                <Users className="h-3 w-3" /> {totalEmployees - processedCount} Pendentes de Revisão
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
             <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm min-w-[240px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                 <CreditCard className="h-3.5 w-3.5 text-emerald-400" /> Total Líquido a Pagar
              </p>
              <p className="mt-3 text-3xl font-black italic tracking-tight text-white font-outfit">
                {formatBRL(totalNet)}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 italic">Previsão de desembolso real</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-sm min-w-[240px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                 <Banknote className="h-3.5 w-3.5 text-blue-400" /> Deduções e Encargos
              </p>
              <p className="mt-3 text-3xl font-black italic tracking-tight text-white font-outfit">
                {formatBRL(totalDeductions)}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 italic">INSS/IRRF e descontos manuais</p>
            </div>
          </div>
        </div>
      </CardContent>
    </section>
  )
}
