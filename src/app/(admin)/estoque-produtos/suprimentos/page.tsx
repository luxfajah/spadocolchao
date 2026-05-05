import { SupplyTabs } from "./components/SupplyTabs"
import { OverviewTab } from "./components/OverviewTab"
import { SupplyItemsTab } from "./components/SupplyItemsTab"
import { SuppliersTab } from "./components/SuppliersTab"
import { PurchasesTab } from "./components/PurchasesTab"
import { ReceivingsTab } from "./components/ReceivingsTab"
import { LowStockTab } from "./components/LowStockTab"
import { Button } from "@/components/ui/button"
import { 
  Plus, Boxes, Truck, ShoppingCart, 
  PackagePlus, ChevronDown, 
  Settings2,
  ListPlus,
  Sparkles,
  Search,
  CheckCircle2,
  Activity,
  X,
  Package
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

export default async function SuprimentosPage({ searchParams }: { searchParams: { tab?: string } }) {
  const currentTab = searchParams.tab || "geral"

  // Fetch summary data for the header stats
  const [totalInsumos, totalFornecedores, comprasAbertas, inLowStock] = await Promise.all([
    prisma.supplyItem.count({ where: { isActive: true } }),
    prisma.supplier.count({ where: { isActive: true } }),
    prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'PENDING'] } } }),
    prisma.supplyItem.count({
      where: {
        isActive: true,
        currentStock: { lt: prisma.supplyItem.fields.minimumStock }
      }
    })
  ])

  return (
    <main className="flex-1 space-y-10 animate-in fade-in duration-700 pb-20">
      {/* PREMIUM HEADER - CUSTOM SECTION */}
      <section className="relative overflow-hidden rounded-[2.75rem] border border-slate-900 bg-slate-950 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.85)] mx-6 mt-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_35%)]" />
        <div className="relative p-8 md:p-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="min-w-0 max-w-[42rem] space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Central de Suprimentos
              </div>
              <div className="min-w-0 space-y-3">
                <h2 className="text-3xl leading-[0.95] md:text-5xl font-black uppercase italic tracking-tight font-outfit">
                  Gestão de Insumos
                </h2>
                <p className="max-w-3xl text-sm text-slate-300 leading-relaxed font-medium font-sans">
                  Controle unificado de materiais, fornecedores homologados e fluxo de compras com inteligência de estoque e reposição.
                </p>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col items-start gap-4 lg:w-auto lg:items-end">
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all font-bold text-xs px-6 h-14 shadow-sm uppercase tracking-wider">
                      <ListPlus className="h-4 w-4" /> Cadastros <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-3xl border-slate-100 shadow-2xl mt-2 bg-white text-slate-900">
                    <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-2 uppercase tracking-[0.2em]">Cadastros Gerais</DropdownMenuLabel>
                    <Link href="/estoque-produtos/insumos/new">
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary">
                        <PackagePlus className="h-4 w-4" /> Novo Insumo
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/estoque-produtos/fornecedores/new">
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary">
                        <Truck className="h-4 w-4" /> Novo Fornecedor
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/estoque-produtos/compras/new">
                  <Button className="rounded-full gap-3 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all px-10 h-14 font-black text-xs uppercase tracking-[0.1em]">
                    <Plus className="h-5 w-5" /> Registrar Compra
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Insumos Ativos", value: totalInsumos, icon: Package, color: "text-blue-400" },
              { label: "Fornecedores", value: totalFornecedores, icon: Truck, color: "text-indigo-400" },
              { label: "Compras Abertas", value: comprasAbertas, icon: ShoppingCart, color: "text-purple-400" },
              { label: "Baixo Estoque", value: inLowStock, icon: inLowStock > 0 ? Activity : CheckCircle2, color: inLowStock > 0 ? "text-rose-400" : "text-emerald-400" }
            ].map((stat, i) => (
              <div key={i} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 group hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="text-3xl font-black italic font-outfit tracking-tighter text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION - STICKY STYLE */}
      <div className="sticky top-6 z-10 mx-6 bg-white/95 backdrop-blur-md p-2 rounded-[2.5rem] shadow-lahomes border border-slate-50 flex overflow-x-auto no-scrollbar">
        <SupplyTabs currentTab={currentTab} />
      </div>

      {/* TAB CONTENT AREA */}
      <div className="mx-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentTab === "geral" && <OverviewTab />}
        {currentTab === "insumos" && <SupplyItemsTab />}
        {currentTab === "fornecedores" && <SuppliersTab />}
        {currentTab === "compras" && <PurchasesTab />}
        {currentTab === "recebimentos" && <ReceivingsTab />}
        {currentTab === "baixo_estoque" && <LowStockTab />}
      </div>
    </main>
  )
}
