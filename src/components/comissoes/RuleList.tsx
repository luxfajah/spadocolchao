"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  MoreVertical,
  ChevronRight,
  Calculator,
  Percent,
  DollarSign
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface RuleListProps {
  rules: any[]
  onEdit: (rule: any) => void
  onDelete: (id: string) => void
  onToggleStatus: (rule: any) => void
}

export function RuleList({ rules, onEdit, onDelete, onToggleStatus }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-20 border border-slate-100 shadow-sm text-center space-y-4">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto">
          <Calculator className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Nenhuma Regra Ativa</h3>
        <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm">Crie sua primeira regra de comissão para começar a automatizar os incentivos.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
            <TableHead className="h-16 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Prioridade</TableHead>
            <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Nome da Regra</TableHead>
            <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Tipo / Cálculo</TableHead>
            <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Gatilho</TableHead>
            <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Condições</TableHead>
            <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
              <TableCell className="px-8 font-black text-sm text-slate-400">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${rule.priority > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100'}`}>
                  {rule.priority}
                </span>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="font-black text-slate-800 uppercase tracking-tight italic text-sm group-hover:text-primary transition-colors">
                    {rule.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {rule.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    {rule.calculationType === 'PERCENTAGE' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-xs text-slate-700">
                      {rule.calculationType === 'PERCENTAGE' ? `${rule.percentage}%` : 
                       rule.calculationType === 'FIXED' ? `R$ ${rule.fixedAmount}` : 
                       'Híbrido'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      sobre {rule.baseType.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <Badge variant="outline" className="rounded-full border-slate-200 text-slate-500 font-black text-[9px] uppercase tracking-widest px-3 py-1">
                  {rule.appliesOn}
                </Badge>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex items-center gap-1">
                  {rule.conditions?.length > 0 ? (
                    <div className="flex -space-x-2">
                      {rule.conditions.slice(0, 3).map((c: any, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500 uppercase" title={c.conditionType}>
                          {c.conditionType.charAt(0)}
                        </div>
                      ))}
                      {rule.conditions.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-950 flex items-center justify-center text-[8px] font-black text-white">
                          +{rule.conditions.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-bold uppercase italic">Sem filtros</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 p-0 hover:bg-white hover:shadow-sm rounded-full transition-all">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-100 shadow-xl p-2">
                    <DropdownMenuItem onClick={() => onEdit(rule)} className="rounded-xl px-4 py-3 cursor-pointer gap-3 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-primary">
                      <Edit className="h-4 w-4" /> Editar Regra
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleStatus(rule)} className="rounded-xl px-4 py-3 cursor-pointer gap-3 font-black text-[10px] uppercase tracking-widest text-slate-600">
                      {rule.isActive ? <><Pause className="h-4 w-4" /> Pausar</> : <><Play className="h-4 w-4 text-emerald-500" /> Ativar</>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(rule.id)} className="rounded-xl px-4 py-3 cursor-pointer gap-3 font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
