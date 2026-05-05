"use client"

import { useState } from "react"
import { SessionList } from "./SessionList"
import { SessionDialog } from "./SessionDialog"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileDown, Presentation, TerminalSquare, PlusCircle, History, ShieldCheck, Timer } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"

export function SessionClient({ initialData }: { initialData: any[] }) {
  const [sessions, setSessions] = useState(initialData)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showDialog, setShowDialog] = useState(false)

  // Em um app real, pegar o user logado (session provider do NextAuth)
  const mockUserId = sessions[0]?.openedById || "dummy-id"

  const handleSelectSession = (sess: any) => {
    setSelectedSession(sess)
    setShowDialog(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-1 font-outfit">
      <PageHeader 
        title="Fechamento de Caixa"
        subtitle="Controle operacional de aberturas, fechamentos e conciliação de PDV."
        icon={<TerminalSquare className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex flex-wrap gap-4">
            <Link href="/financeiro/dashboard">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
            >
                <Presentation className="h-4 w-4 text-primary" /> Relatório Cego
            </Button>
            <Button 
              className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] border-none text-white"
            >
              <PlusCircle className="h-4 w-4" /> Abrir Novo Caixa
            </Button>
          </div>
        }
      />

      {/* Métricas de Sessão */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
            <History className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caixas Abertos</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-2">
              {sessions.filter(s => s.status === 'OPEN').length} <span className="text-[10px] text-slate-400 uppercase ml-1">Sessões</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conciliados (Hoje)</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-2">
              {sessions.filter(s => s.status === 'CLOSED').length} <span className="text-[10px] text-slate-400 uppercase ml-1">Fechados</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Timer className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo Médio</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-2">
              08:45 <span className="text-[10px] text-slate-400 uppercase ml-1">Horas</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
            <FileDown className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relatórios</p>
            <p className="text-xs font-black text-slate-700 leading-none mt-3 uppercase tracking-tight">
              Exportar <span className="text-slate-400 ml-1">PDF/Excel</span>
            </p>
          </div>
        </div>
      </div>

      <SessionList sessions={sessions} onSelectSession={handleSelectSession} />

      <SessionDialog 
        open={showDialog} 
        onOpenChange={setShowDialog} 
        session={selectedSession} 
        closingUserId={mockUserId} 
      />
    </div>
  )
}
