"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Printer, FileEdit, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"


import { ApprovedMirrorPdfButton } from "../../components/ApprovedMirrorPdfButton"
import { generateEmployeePayrollDraft } from "../../../folha/actions"

type MirrorDetailHeaderActionsProps = {
  mirrorId: string
  employeeId: string
  period: string
  canGeneratePayroll?: boolean
  autoOpenPdf?: boolean
}

export function MirrorDetailHeaderActions({
  mirrorId,
  employeeId,
  period,
  canGeneratePayroll = true,
  autoOpenPdf = false,
}: MirrorDetailHeaderActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleGenerateDraft() {
    startTransition(async () => {
      try {
        const result = await generateEmployeePayrollDraft(employeeId, period)
        toast({
          title: "Rascunho gerado",
          description: "Redirecionando para a gestão de folha...",
        })
        router.push(`/rh/folha?period=${result.period}&q=${employeeId}`)
      } catch (error) {
        toast({
          title: "Erro ao gerar rascunho",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div id="mirror-actions" className="flex gap-3">
      <ApprovedMirrorPdfButton
        mirrorId={mirrorId}
        autoOpen={autoOpenPdf}
        label="Imprimir"
        icon={<Printer className="h-4 w-4" />}
        variant="secondary"
        className="rounded-full gap-2 bg-white border border-slate-100 hover:bg-slate-50 shadow-sm transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-slate-600"
      />

      <ApprovedMirrorPdfButton
        mirrorId={mirrorId}
        label="PDF Oficial"
        className="rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white"
      />

      {canGeneratePayroll && (
        <Button
          onClick={handleGenerateDraft}
          disabled={isPending}
          className="rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileEdit className="h-4 w-4" />}
          Gerar Rascunho de Holerite
        </Button>
      )}
    </div>
  )
}
