"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function SupplyTabs({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: "geral", label: "Visão Geral" },
    { id: "insumos", label: "Insumos" },
    { id: "fornecedores", label: "Fornecedores" },
    { id: "compras", label: "Compras" },
    { id: "recebimentos", label: "Recebimentos" },
    { id: "baixo_estoque", label: "Baixo Estoque" },
  ]

  return (
    <nav className="flex items-center gap-1 w-full" aria-label="Tabs">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id
        return (
          <Link
            key={tab.id}
            href={`/estoque-produtos/suprimentos?tab=${tab.id}`}
            className={cn(
              "flex-1 min-w-fit whitespace-nowrap h-12 px-6 rounded-[1.8rem] flex items-center justify-center text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
              isActive 
                ? "bg-white text-primary shadow-sm ring-1 ring-slate-100" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
