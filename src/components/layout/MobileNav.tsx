"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  Briefcase,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Home,
  Layers,
  MapPin,
  MoreHorizontal,
  Package,
  PieChart,
  Settings2,
  Shield,
  Store,
  Tags,
  Target,
  Users,
  UserSquare2,
  Wallet,
} from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AppArea } from "@/lib/role-presets"

const MORE_SESSIONS = [
  {
    group: "Vendas e Clientes",
    items: [
      { title: "PDV", href: "/pdv", icon: Store, requiredArea: "pdv" },
      { title: "Central de Pedidos", href: "/vendas-clientes/pedidos", icon: ClipboardList, requiredArea: "orders" },
      { title: "Kanban de Pedidos", href: "/vendas-clientes/kanban", icon: Layers, requiredArea: "kanban" },
      { title: "Central de Clientes", href: "/vendas-clientes/clientes", icon: Users, requiredArea: "customers" },
      { title: "Motor de Vendas", href: "/vendas-clientes/vendas", icon: Tags, requiredArea: "sales" },
      { title: "Motor de Comissões", href: "/vendas-clientes/comissoes", icon: PieChart, requiredArea: "commissions" },
    ],
  },
  {
    group: "Estoque e Produtos",
    items: [
      { title: "Produtos e Serviços", href: "/estoque-produtos/produtos-servicos", icon: Package, requiredArea: "supplies" },
      { title: "Ficha Técnica", href: "/estoque-produtos/ficha-tecnica", icon: FileText, requiredArea: "supplies" },
      { title: "Suprimentos", href: "/estoque-produtos/suprimentos", icon: Layers, requiredArea: "supplies" },
    ],
  },
  {
    group: "Financeiro",
    items: [
      { title: "Contas a Pagar", href: "/financeiro/contas-a-pagar", icon: Wallet, requiredArea: "financial" },
      { title: "Contas a Receber", href: "/financeiro/contas-a-receber", icon: DollarSign, requiredArea: "financial" },
      { title: "Fluxo de Caixa", href: "/financeiro/fluxo-de-caixa", icon: PieChart, requiredArea: "financial" },
      { title: "Fechamento de Caixa", href: "/financeiro/fechamento-de-caixa", icon: Briefcase, requiredArea: "financial" },
      { title: "Centros de Custo", href: "/financeiro/centros-de-custo", icon: Target, requiredArea: "financial" },
      { title: "Formas de Pagamento", href: "/financeiro/formas-de-pagamento", icon: Wallet, requiredArea: "financial" },
    ],
  },
  {
    group: "RH",
    items: [
      { title: "Dashboard", href: "/rh/dashboard", icon: PieChart, requiredArea: "hr" },
      { title: "Funcionários", href: "/rh/funcionarios", icon: Users, requiredArea: "hr" },
      { title: "Cargos", href: "/rh/cargos", icon: Briefcase, requiredArea: "hr" },
      { title: "Vagas", href: "/rh/vagas", icon: Briefcase, requiredArea: "hr" },
      { title: "Candidatos", href: "/rh/candidatos", icon: UserSquare2, requiredArea: "hr" },
      { title: "Entrevistas", href: "/rh/entrevistas", icon: Clock, requiredArea: "hr" },
      { title: "Advertências", href: "/rh/advertencias", icon: Shield, requiredArea: "hr" },
      { title: "Desligamentos", href: "/rh/desligamentos", icon: FileText, requiredArea: "hr" },
      { title: "Espelho de Ponto", href: "/rh/ponto", icon: Clock, requiredArea: "hr" },
      { title: "Holerites", href: "/rh/folha", icon: Wallet, requiredArea: "hr" },
    ],
  },
  {
    group: "Configurações",
    items: [
      { title: "Hub de Configurações", href: "/configuracoes", icon: Settings2, requiredArea: "settings" },
      { title: "Parâmetros", href: "/configuracoes/parametros", icon: Settings2, requiredArea: "settings" },
      { title: "Empresa", href: "/configuracoes/empresa", icon: Store, requiredArea: "settings" },
      { title: "Backup", href: "/configuracoes/backup", icon: Briefcase, requiredArea: "settings" },
      { title: "Auditoria", href: "/configuracoes/auditoria", icon: MapPin, requiredArea: "settings" },
    ],
  },
] as const

const QUICK_LINKS = [
  { title: "Vendas", href: "/vendas-clientes/vendas", icon: Tags, area: "sales" as AppArea, shortLabel: "Motor" },
  { title: "Financeiro", href: "/financeiro/fluxo-de-caixa", icon: Wallet, area: "financial" as AppArea, shortLabel: "Financ." },
  { title: "Estoque", href: "/estoque-produtos/produtos-servicos", icon: Package, area: "supplies" as AppArea, shortLabel: "Estoque" },
  { title: "PDV", href: "/pdv", icon: Store, area: "pdv" as AppArea, shortLabel: "PDV" },
  { title: "Pedidos", href: "/vendas-clientes/pedidos", icon: ClipboardList, area: "orders" as AppArea, shortLabel: "Pedidos" },
  { title: "Kanban", href: "/vendas-clientes/kanban", icon: Layers, area: "kanban" as AppArea, shortLabel: "Kanban" },
  { title: "RH", href: "/rh/dashboard", icon: Users, area: "hr" as AppArea, shortLabel: "RH" },
] as const

function canAccessArea(allowedAreas: AppArea[], area?: AppArea | string) {
  return !area || allowedAreas.includes(area as AppArea)
}

export function MobileNav({ allowedAreas, homeHref }: { allowedAreas: AppArea[]; homeHref: string }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const visibleSessions = MORE_SESSIONS.map((session) => ({
    ...session,
    items: session.items.filter((item) => canAccessArea(allowedAreas, item.requiredArea)),
  })).filter((session) => session.items.length > 0)

  const rawItems = [
    { href: "/vendas-clientes/vendas", icon: Tags, label: "Vendas", area: "sales" as AppArea },
    { href: "/financeiro/dashboard", icon: Wallet, label: "Financeiro", area: "financial" as AppArea },
    { href: homeHref, icon: Home, label: "Início", area: undefined },
    { href: "/pdv", icon: Store, label: "PDV", area: "pdv" as AppArea },
  ]

  const navItems = rawItems.filter((item) => !item.area || canAccessArea(allowedAreas, item.area))

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+10px)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = item.href === homeHref ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full py-1.5 gap-1 transition-all duration-300 relative ${
              active ? "text-primary scale-105" : "text-slate-500 hover:text-slate-750"
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all duration-300 ${
              active ? "bg-primary/10 shadow-sm" : ""
            }`}>
              <Icon size={20} className={active ? "stroke-[2.5px]" : "stroke-[2px]"} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-300 ${
              active ? "text-primary font-bold" : "text-slate-400"
            }`}>
              {item.label}
            </span>
            {active && (
              <div className="absolute top-0 w-8 h-[3px] bg-primary rounded-full animate-in fade-in duration-300" />
            )}
          </Link>
        )
      })}

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <button
            className={`flex flex-col items-center justify-center w-full py-1.5 gap-1 transition-all duration-300 relative ${
              isOpen ? "text-primary scale-105" : "text-slate-500 hover:text-slate-750"
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all duration-300 ${
              isOpen ? "bg-primary/10 shadow-sm" : ""
            }`}>
              <MoreHorizontal size={20} className={isOpen ? "stroke-[2.5px]" : "stroke-[2px]"} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-300 ${
              isOpen ? "text-primary font-bold" : "text-slate-400"
            }`}>
              Mais
            </span>
            {isOpen && (
              <div className="absolute top-0 w-8 h-[3px] bg-primary rounded-full animate-in fade-in duration-300" />
            )}
          </button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] rounded-t-[3rem] border-slate-100 p-0 shadow-2xl">
          <div className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-slate-200" />
          <DrawerHeader className="px-8 pt-4 pb-2">
            <DrawerTitle className="font-outfit text-2xl font-black uppercase tracking-tighter text-primary">Portal Spa do Colchão</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-8 pb-12 custom-scrollbar">
            <div className="mt-6 space-y-10">
              {canAccessArea(allowedAreas, "pdv") ? (
                <div>
                  <Link href="/pdv" onClick={() => setIsOpen(false)} className="group relative flex items-center justify-between overflow-hidden rounded-[2rem] bg-primary p-5 text-white shadow-xl shadow-primary/20">
                    <div className="absolute top-[-10px] right-[-10px] opacity-10 transition-transform group-hover:scale-110">
                      <Store className="h-24 w-24" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Store className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-outfit text-base font-black uppercase">Frente de Caixa</span>
                        <span className="text-[10px] font-bold opacity-70">Vendas Rápidas</span>
                      </div>
                    </div>
                    <div className="relative z-10 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-primary">Abrir</div>
                  </Link>
                </div>
              ) : null}

              {visibleSessions.map((session) => (
                <div key={session.group}>
                  <h3 className="mb-5 flex items-center gap-3 pl-1 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                    {session.group}
                    <div className="h-px flex-1 bg-slate-100" />
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {session.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "group/btn flex items-center gap-4 rounded-3xl p-4 transition-all duration-300",
                          pathname === item.href ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform group-hover/btn:scale-110",
                            pathname === item.href ? "text-white" : "text-slate-450",
                          )}
                        />
                        <span className="truncate text-[11px] font-bold tracking-tight">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </nav>
  )
}
