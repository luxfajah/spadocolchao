import { Card, CardContent } from "@/components/ui/card"
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XSquare,
  Percent
} from "lucide-react"

interface SalesSummaryProps {
  stats: {
    todayTotal: number
    monthTotal: number
    ticketMedio: number
    pendingTotal: number
    paidTotal: number
    cancelledCount: number
  }
}

export function SalesSummary({ stats }: SalesSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const cards = [
    {
      title: "Vendas do Dia",
      value: formatCurrency(stats.todayTotal),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Vendas do Mês",
      value: formatCurrency(stats.monthTotal),
      icon: Calendar,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats.ticketMedio),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Total em Aberto",
      value: formatCurrency(stats.pendingTotal),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Total Pago",
      value: formatCurrency(stats.paidTotal),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Vendas Canceladas",
      value: stats.cancelledCount.toString(),
      icon: XSquare,
      color: "text-rose-600",
      bg: "bg-rose-50"
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {cards.map((card, i) => (
        <Card key={i} className="border-white/40 shadow-lahomes rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 pb-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{card.title}</p>
                <div className={`p-2 rounded-xl ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black text-primary font-outfit tracking-tighter italic">{card.value}</p>
                <div className="h-1 w-12 bg-primary/10 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

