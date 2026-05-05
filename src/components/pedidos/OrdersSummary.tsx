import { Card, CardContent } from "@/components/ui/card"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
  Settings,
  Truck,
  XSquare,
} from "lucide-react"

interface OrdersSummaryProps {
  stats: {
    sold: number
    waitingPreparation: number
    inProduction: number
    waitingDelivery: number
    delivered: number
    finalized: number
    delayed: number
    cancelled: number
  }
}

export function OrdersSummary({ stats }: OrdersSummaryProps) {
  const cards = [
    {
      title: "Entrada no fluxo",
      value: stats.sold.toString(),
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Aguardando preparo",
      value: stats.waitingPreparation.toString(),
      icon: Settings,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Em producao",
      value: stats.inProduction.toString(),
      icon: Package,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Fila de entrega",
      value: stats.waitingDelivery.toString(),
      icon: Truck,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      title: "Entregues",
      value: stats.delivered.toString(),
      icon: Truck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Finalizados",
      value: stats.finalized.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Atrasados",
      value: stats.delayed.toString(),
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "Cancelados",
      value: stats.cancelled.toString(),
      icon: XSquare,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="group overflow-hidden rounded-[2.5rem] border-white/40 bg-white/90 shadow-lahomes backdrop-blur-sm transition-all hover:scale-[1.02]"
        >
          <CardContent className="p-8 pb-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  {card.title}
                </p>
                <div className={`rounded-xl p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-outfit text-3xl font-black italic tracking-tighter text-primary">
                  {card.value}
                </p>
                <div className="h-1 w-12 rounded-full bg-primary/10" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
