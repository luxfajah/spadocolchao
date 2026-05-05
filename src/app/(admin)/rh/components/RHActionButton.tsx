"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, UserPlus, CalendarCheck, AlertOctagon, PowerOff } from "lucide-react"
import { NovoCandidatoModal } from "./NovoCandidatoModal"
import { AgendarEntrevistaModal } from "./AgendarEntrevistaModal"
import { NovaOcorrenciaModal } from "./NovaOcorrenciaModal"
import { NovoDesligamentoModal } from "./NovoDesligamentoModal"

type ModalType = "candidato" | "entrevista" | "ocorrencia" | "desligamento"

interface RHActionButtonProps {
  type: ModalType
  className?: string
}

export function RHActionButton({ type, className }: RHActionButtonProps) {
  const [open, setOpen] = useState(false)

  const configs = {
    candidato: {
      label: "Novo Candidato",
      icon: <UserPlus className="h-4 w-4" />,
      btnClass: "bg-primary hover:bg-primary/90 shadow-primary/20",
    },
    entrevista: {
      label: "Agendar Entrevista",
      icon: <CalendarCheck className="h-4 w-4" />,
      btnClass: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20",
    },
    ocorrencia: {
      label: "Nova Ocorrência",
      icon: <AlertOctagon className="h-4 w-4" />,
      btnClass: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
    },
    desligamento: {
      label: "Novo Desligamento",
      icon: <PowerOff className="h-4 w-4" />,
      btnClass: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20",
    },
  }

  const { label, icon, btnClass } = configs[type]

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={`rounded-full gap-2 shadow-lg transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white ${btnClass} ${className || ""}`}
      >
        {icon} {label}
      </Button>

      {type === "candidato" && (
        <NovoCandidatoModal open={open} onOpenChange={setOpen} />
      )}
      {type === "entrevista" && (
        <AgendarEntrevistaModal open={open} onOpenChange={setOpen} />
      )}
      {type === "ocorrencia" && (
        <NovaOcorrenciaModal open={open} onOpenChange={setOpen} />
      )}
      {type === "desligamento" && (
        <NovoDesligamentoModal open={open} onOpenChange={setOpen} />
      )}
    </>
  )
}
