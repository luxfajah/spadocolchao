"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Clock, Lock, ShieldCheck, TerminalSquare, UserCheck, ArrowRight, Wallet } from "lucide-react"

export function SessionList({ sessions, onSelectSession }: { sessions: any[], onSelectSession: (s: any) => void }) {
  if (sessions.length === 0) {
    return (
       <div className="bg-white p-20 rounded-[2.5rem] shadow-lahomes border border-slate-100/50 text-center flex flex-col items-center justify-center gap-6">
         <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner">
           <TerminalSquare className="w-12 h-12 text-slate-300" />
         </div>
         <div>
           <h3 className="text-2xl font-black text-slate-900 font-outfit uppercase italic tracking-tighter">Nenhum Registro</h3>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Não há histórico de sessões de caixa abertas ou fechadas.</p>
         </div>
         <Button variant="outline" className="rounded-full px-8 py-5 h-auto text-[10px] font-black uppercase tracking-widest border-slate-200">
            Atualizar Base de Dados
         </Button>
       </div>
    )
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-100/50 overflow-hidden font-outfit">
      <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 italic">Sessões Operacionais</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Histórico cronológico de movimentações e operadores</p>
          </div>
          <Badge className="rounded-full bg-slate-50 border border-slate-100 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {sessions.length} CAIXAS LISTADOS
          </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocolo / Fundo</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Abertura / Operador</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Fechamento / Conciliação</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Movimentos</TableHead>
              <TableHead className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Status do Caixa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((sess) => {
              const isOpen = sess.status === 'OPEN'
              
              return (
                <TableRow 
                  key={sess.id} 
                  className="group border-slate-50/50 hover:bg-slate-50/30 transition-all cursor-pointer"
                  onClick={() => onSelectSession(sess)}
                >
                  <TableCell className="px-10 py-8">
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-sm text-slate-800 uppercase tracking-tight">
                            # {sess.id.split('-')[0]}
                          </span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                             FUNDO: {formatCurrency(sess.openingBalance)}
                          </span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <span className="font-bold text-xs text-slate-700 uppercase">{formatDate(sess.openedAt)} em {new Date(sess.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                       <div className="flex items-center gap-1.5 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-200/50">
                           <UserCheck className="w-3 h-3 text-slate-400" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{sess.openedBy.name}</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-8 text-center">
                    {sess.closedAt ? (
                       <div className="flex flex-col items-center justify-center gap-2">
                          <span className="font-bold text-xs text-slate-700 uppercase">{formatDate(sess.closedAt)} em {new Date(sess.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={cn(
                              "text-[10px] font-black uppercase tracking-[0.1em]",
                              (sess.difference || 0) < 0 ? "text-rose-500" : "text-emerald-500"
                          )}>
                              DIF: {formatCurrency(sess.difference || 0)}
                          </span>
                       </div>
                    ) : (
                       <div className="flex items-center justify-center gap-2 text-amber-500 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Sessão em andamento</span>
                       </div>
                    )}
                  </TableCell>
                  <TableCell className="py-8 text-center">
                     <div className="inline-flex flex-col items-center">
                        <span className="font-black text-xl text-slate-400 group-hover:text-slate-900 transition-colors">{sess._count?.movements || 0}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lançamentos</span>
                     </div>
                  </TableCell>
                  <TableCell className="px-10 py-8">
                     <div className="flex justify-end gap-4 items-center">
                       {isOpen ? (
                          <Badge className="bg-amber-50 text-amber-600 border border-amber-200/50 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-sm">
                             <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Operacional
                          </Badge>
                       ) : (
                          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-sm">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conciliado
                          </Badge>
                       )}
                       <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                          <ArrowRight className="h-5 w-5" />
                       </Button>
                     </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
