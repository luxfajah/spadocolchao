import { Suspense } from "react"
import { 
  PlusCircle, 
  ReceiptText, 
  Settings2,
  Users
} from "lucide-react"

import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { 
  getHoleritesData, 
  getPayrollStats, 
  getJobTitlesAndDepartments 
} from "./actions"
import { HoleriteStats } from "./components/HoleriteStats"
import { HoleriteFilters } from "./components/HoleriteFilters"
import { HoleriteTable } from "./components/HoleriteTable"
import { BulkGenerationButton } from "./components/BulkGenerationButton"

export default async function FolhaPage({
  searchParams,
}: {
  searchParams?: { q?: string; department?: string; period?: string }
}) {
  const period = searchParams?.period || new Date().toISOString().slice(0, 7)
  const q = searchParams?.q || ""
  const department = searchParams?.department || "all"

  // Fetching data
  const [employees, stats, { departments }] = await Promise.all([
    getHoleritesData(period, q, department),
    getPayrollStats(period),
    getJobTitlesAndDepartments()
  ])

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Gestão de Folha e Holerites"
        subtitle="CONTROLE DE PROVENTOS, DESCONTOS E EMISSÃO DE COMPROVANTES DE PAGAMENTO."
        icon={<ReceiptText className="h-8 w-8 text-emerald-600" />}
        actions={
          <div className="flex gap-3">
             <BulkGenerationButton 
              period={period} 
              departments={departments}
            />
          </div>
        }
      />

      {/* Seção Spotlight Estatística */}
      <HoleriteStats 
        totalGross={stats.totalGross}
        totalNet={stats.totalNet}
        totalDeductions={stats.totalDeductions}
        processedCount={stats.processedCount}
        totalEmployees={employees.length}
      />

      {/* Filtros e Busca */}
      <HoleriteFilters departments={departments} />

      {/* Lista Principal de Colaboradores */}
      <Suspense fallback={
        <div className="h-96 w-full bg-white/5 rounded-[2.5rem] border border-white/10 animate-pulse flex items-center justify-center">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando dados da folha...</p>
        </div>
      }>
        <HoleriteTable employees={employees} period={period} />
      </Suspense>
      
      {/* Rodapé Informativo */}
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Cálculos integrados à política fiscal de 2026 oficial com integração financeira automática
        </p>
      </div>
    </main>
  )
}
