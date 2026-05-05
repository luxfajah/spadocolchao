"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BedDouble,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Home as HomeIcon,
  Layers,
  MapPin,
  Package,
  PieChart,
  Settings2,
  Shield,
  Store,
  Tags,
  Target,
  UserSquare2,
  Users,
  Wallet,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { AppArea } from "@/lib/role-presets"

const NAV_ITEMS = [
  {
    group: "Vendas e Clientes",
    icon: Tags,
    items: [
      { title: "PDV", href: "/pdv", icon: Store, requiredArea: "pdv" },
      { title: "Motor de Vendas", href: "/vendas-clientes/vendas", icon: Tags, requiredArea: "sales" },
      { title: "Central de Pedidos", href: "/vendas-clientes/pedidos", icon: ClipboardList, requiredArea: "orders" },
      { title: "Kanban de Pedidos", href: "/vendas-clientes/kanban", icon: Layers, requiredArea: "kanban" },
      { title: "Central de Clientes", href: "/vendas-clientes/clientes", icon: Users, requiredArea: "customers" },
      { title: "Motor de Comissões", href: "/vendas-clientes/comissoes", icon: PieChart, requiredArea: "commissions" },
    ],
  },
  {
    group: "Estoque e Produtos",
    icon: Package,
    items: [
      { title: "Produtos e Serviços", href: "/estoque-produtos/produtos-servicos", icon: Package, requiredArea: "supplies" },
      { title: "Suprimentos", href: "/estoque-produtos/suprimentos", icon: Layers, requiredArea: "supplies" },
    ],
  },
  {
    group: "Financeiro",
    icon: Wallet,
    items: [
      { title: "Dashboard", href: "/financeiro/dashboard", icon: PieChart, requiredArea: "financial" },
      { title: "Contas a Pagar", href: "/financeiro/contas-a-pagar", icon: Wallet, requiredArea: "financial" },
      { title: "Contas a Receber", href: "/financeiro/contas-a-receber", icon: DollarSign, requiredArea: "financial" },
      { title: "Fluxo de Caixa", href: "/financeiro/fluxo-de-caixa", icon: PieChart, requiredArea: "financial" },
      { title: "Centros de Custo", href: "/financeiro/centros-de-custo", icon: Target, requiredArea: "financial" },
    ],
  },
  {
    group: "RH",
    icon: Users,
    items: [
      { title: "Dashboard", href: "/rh/dashboard", icon: PieChart, requiredArea: "hr" },
      { title: "Funcionários", href: "/rh/funcionarios", icon: Users, requiredArea: "hr" },
      { title: "Processos Seletivos", href: "/rh/processos-seletivos", icon: Briefcase, requiredArea: "hr" },
      { title: "Cargos", href: "/rh/cargos", icon: Briefcase, requiredArea: "hr" },
      { title: "Espelho de Ponto", href: "/rh/ponto", icon: Clock, requiredArea: "hr" },
      { title: "Holerites", href: "/rh/folha", icon: Wallet, requiredArea: "hr" },
    ],
  },
  {
    group: "Configurações",
    icon: Settings2,
    items: [
      { title: "Hub de Configurações", href: "/configuracoes", icon: Settings2, requiredArea: "settings" },
      { title: "Empresa", href: "/configuracoes/empresa", icon: Store, requiredArea: "settings" },
      { title: "Segurança", href: "/configuracoes/seguranca", icon: Shield, requiredArea: "settings" },
      { title: "Parâmetros", href: "/configuracoes/parametros", icon: Settings2, requiredArea: "settings" },
      { title: "Automações", href: "/configuracoes/automacoes", icon: Clock, requiredArea: "settings" },
      { title: "Backup", href: "/configuracoes/backup", icon: Briefcase, requiredArea: "settings" },
      { title: "Auditoria", href: "/configuracoes/auditoria", icon: MapPin, requiredArea: "settings" },
    ],
  },
]

function canAccessArea(allowedAreas: AppArea[], area?: AppArea | string) {
  return !area || allowedAreas.includes(area as AppArea)
}

export function Sidebar({
  className,
  onNavClick,
  allowedAreas,
  homeHref,
}: {
  className?: string
  onNavClick?: () => void
  allowedAreas: AppArea[]
  homeHref: string
}) {
  const pathname = usePathname()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const visibleGroups = useMemo(
    () =>
      NAV_ITEMS.map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessArea(allowedAreas, item.requiredArea)),
      })).filter((group) => group.items.length > 0),
    [allowedAreas],
  )

  useEffect(() => {
    const currentGroup = visibleGroups.find((group) => group.items.some((item) => pathname.startsWith(item.href)))
    if (currentGroup) {
      setOpenGroup(currentGroup.group)
    }
  }, [pathname, visibleGroups])

  const toggleGroup = (groupName: string) => {
    setOpenGroup(openGroup === groupName ? null : groupName)
  }

  return (
    <div
      className={cn(
        "fixed left-6 z-50 flex flex-col bg-white border border-slate-100 transition-all duration-500 ease-in-out shadow-2xl rounded-[2.5rem] overflow-hidden",
        "top-1/2 -translate-y-1/2 h-fit max-h-[90vh] w-72",
        className,
      )}
    >
      <div className="flex flex-col h-full py-6 custom-scrollbar overflow-x-hidden">
        <div className="flex items-center px-6 mb-6 gap-4 justify-start">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <BedDouble className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col opacity-100">
            <span className="text-primary font-black text-lg leading-tight font-outfit uppercase tracking-tighter whitespace-nowrap">
              Spa do Colchão
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise</span>
          </div>
        </div>

        <div className="flex-1 px-3 space-y-2">
          <Link
            href={homeHref}
            onClick={onNavClick}
            className={cn(
              "flex items-center rounded-2xl transition-all duration-500 group relative px-5 py-4 w-full",
              pathname === homeHref
                ? "bg-primary text-white shadow-xl shadow-primary/20"
                : "text-slate-600 hover:bg-slate-50 hover:text-primary",
            )}
          >
            <HomeIcon
              className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                pathname === homeHref ? "text-white" : "text-slate-600",
              )}
            />
            <span className="font-bold text-sm ml-4 whitespace-nowrap">Página Inicial</span>
          </Link>

          {visibleGroups.map((group, index) => {
            const isOpen = openGroup === group.group
            const someActive = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

            return (
              <div key={index} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className={cn(
                    "flex items-center justify-between px-5 py-4 w-full transition-all duration-500 rounded-2xl group",
                    isOpen ? "bg-slate-50/50" : "",
                    someActive && !isOpen ? "bg-slate-100 text-primary" : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <group.icon className={cn("h-5 w-5 shrink-0 transition-all", someActive || isOpen ? "text-primary" : "text-slate-600")} />
                    <span className="text-sm font-bold whitespace-nowrap">{group.group}</span>
                  </div>
                  {isOpen ? <ChevronDown className="h-4 w-4 opacity-40" /> : <ChevronRight className="h-4 w-4 opacity-40" />}
                </button>

                {isOpen && (
                  <div className="overflow-hidden bg-slate-50/50 rounded-2xl animate-in slide-in-from-top-2 duration-300 mb-2">
                    <div className="relative ml-8 pl-4 py-2 space-y-1">
                      <div className="absolute left-0 top-0 bottom-4 w-px bg-slate-200" />

                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavClick}
                            className={cn(
                              "flex items-center py-3 px-4 rounded-xl text-[13px] font-bold transition-all duration-300 relative group/link",
                              isActive
                                ? "text-primary bg-white shadow-sm ring-1 ring-slate-100"
                                : "text-slate-500 hover:text-primary hover:bg-white/50",
                            )}
                          >
                            <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 h-px bg-slate-200 group-hover/link:bg-primary transition-colors" />
                            <item.icon className={cn("h-4 w-4 shrink-0 mr-3", isActive ? "text-primary" : "text-slate-300")} />
                            {item.title}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
