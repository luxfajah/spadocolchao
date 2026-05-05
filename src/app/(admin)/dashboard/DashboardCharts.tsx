"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartData {
  day: string
  acumulado: number
}

interface DashboardChartsProps {
  data: ChartData[]
  metaDiaria: number
}

export function DashboardCharts({ data, metaDiaria }: DashboardChartsProps) {
  return (
    <Card className="col-span-1 overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] text-slate-950 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.35)] lg:col-span-2">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="font-heading text-xl font-black uppercase italic tracking-tight text-slate-950">
          Progresso da Meta
        </CardTitle>
        <CardDescription className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Acumulado do mês com referência diária de R${" "}
          {metaDiaria.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.22)" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip
                formatter={(value: number) => [
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  "Acumulado",
                ]}
                labelStyle={{ color: "#0f172a", fontWeight: "bold" }}
                contentStyle={{
                  borderRadius: "18px",
                  border: "1px solid rgba(226,232,240,1)",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 20px 40px -24px rgba(15,23,42,0.22)",
                }}
              />
              <Line
                type="monotone"
                dataKey="acumulado"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
