"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Edit, Clock, Receipt, AlertOctagon, PowerOff,
  CalendarDays, FileText, MoreHorizontal, X, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { NovaOcorrenciaModal } from "../../components/NovaOcorrenciaModal"
import { NovoDesligamentoModal } from "../../components/NovoDesligamentoModal"

interface Props {
  employeeId: string
  employeeName: string
  isActive: boolean
}

type LinkAction = {
  icon: React.ElementType
  label: string
  type: "link"
  href: (id: string) => string
  color: string
}
type ModalAction = {
  icon: React.ElementType
  label: string
  type: "modal"
  modal: "ocorrencia" | "desligamento"
  color: string
}
type Action = LinkAction | ModalAction

const ACTION_GROUPS: { label: string; color: string; actions: Action[] }[] = [
  {
    label: "Operações RH",
    color: "indigo",
    actions: [
      { icon: Edit,         label: "Editar Dados",         type: "link",  href: id => `/rh/funcionarios/${id}/editar`,   color: "indigo" },
      { icon: Clock,        label: "Espelho de Ponto",     type: "link",  href: id => `/rh/ponto/${id}`,                 color: "indigo" },
      { icon: Receipt,      label: "Gerar Holerite",       type: "link",  href: id => `/rh/folha?funcionario=${id}`,     color: "indigo" },
    ]
  },
  {
    label: "Gestão de Pessoal",
    color: "amber",
    actions: [
      { icon: CalendarDays, label: "Registrar Férias",     type: "link",  href: id => `/rh/funcionarios/${id}?tab=ferias`, color: "amber" },
      { icon: FileText,     label: "Adicionar Documento",  type: "link",  href: id => `/rh/funcionarios/${id}?tab=docs`,   color: "amber" },
    ]
  },
  {
    label: "Disciplina & Desligamento",
    color: "rose",
    actions: [
      { icon: AlertOctagon, label: "Nova Ocorrência",       type: "modal", modal: "ocorrencia",   color: "rose" },
      { icon: PowerOff,     label: "Registrar Desligamento",type: "modal", modal: "desligamento", color: "rose" },
    ]
  }
]

const colorMap: Record<string, string> = {
  indigo: "hover:bg-indigo-50 hover:border-indigo-100",
  amber:  "hover:bg-amber-50 hover:border-amber-100",
  rose:   "hover:bg-rose-50 hover:border-rose-100",
}
const iconColorMap: Record<string, string> = {
  indigo: "text-indigo-500 bg-indigo-50",
  amber:  "text-amber-500 bg-amber-50",
  rose:   "text-rose-500 bg-rose-50",
}

export function QuickActionsPanel({ employeeId, employeeName, isActive }: Props) {
  const [open, setOpen] = useState(false)
  const [ocorrenciaOpen, setOcorrenciaOpen] = useState(false)
  const [desligamentoOpen, setDesligamentoOpen] = useState(false)

  function handleModalAction(modal: "ocorrencia" | "desligamento") {
    setOpen(false)
    if (modal === "ocorrencia") setOcorrenciaOpen(true)
    if (modal === "desligamento") setDesligamentoOpen(true)
  }

  return (
    <>
      <div className="relative">
        <Button
          onClick={() => setOpen(prev => !prev)}
          className={`rounded-full h-12 px-6 font-black text-xs uppercase tracking-widest gap-2 transition-all ${
            open
              ? "bg-slate-800 text-white shadow-lg"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          }`}
          variant="ghost"
        >
          {open ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
          {open ? "Fechar" : "Ações Rápidas"}
        </Button>

        {open && (
          <div className="absolute right-0 top-14 z-50 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 bg-slate-800">
              <p className="text-xs font-black text-white uppercase tracking-widest">Ações Rápidas</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{employeeName}</p>
            </div>

            <div className="p-3 space-y-4">
              {ACTION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.actions.map(action => {
                      const Icon = action.icon

                      if (action.type === "link") {
                        return (
                          <Link key={action.label} href={action.href(employeeId)} onClick={() => setOpen(false)}>
                            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent cursor-pointer transition-all ${colorMap[action.color]}`}>
                              <div className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColorMap[action.color]}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-bold text-slate-700 flex-1 whitespace-normal break-words leading-tight">{action.label}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                            </div>
                          </Link>
                        )
                      }

                      // modal action
                      const isDisabled = action.modal === "desligamento" && !isActive
                      return (
                        <button
                          key={action.label}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleModalAction(action.modal)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-transparent transition-all text-left ${
                            isDisabled ? "opacity-40 cursor-not-allowed" : `cursor-pointer ${colorMap[action.color]}`
                          }`}
                        >
                          <div className={`h-7 w-7 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColorMap[action.color]}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 flex-1 whitespace-normal break-words leading-tight">{action.label}</span>
                          {isDisabled && <span className="text-[9px] text-slate-400 uppercase font-black bg-slate-100 px-2 py-0.5 rounded-full ml-auto">Inativo</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <NovaOcorrenciaModal open={ocorrenciaOpen} onOpenChange={setOcorrenciaOpen} employeeId={employeeId} />
      <NovoDesligamentoModal open={desligamentoOpen} onOpenChange={setDesligamentoOpen} employeeId={employeeId} />
    </>
  )
}
