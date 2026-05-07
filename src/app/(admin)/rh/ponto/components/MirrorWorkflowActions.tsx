"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileCheck2, LockOpen, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"


import { confirmMirrorChanges, enableMirrorEditing } from "../[id]/adjust-actions"

type MirrorWorkflowActionsProps = {
  employeeId: string
  period: string
  mirrorId?: string | null
  mirrorStatus?: string | null
  payrollLocked: boolean
}

export function MirrorWorkflowActions({
  employeeId,
  period,
  mirrorId,
  mirrorStatus,
  payrollLocked,
}: MirrorWorkflowActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()



  function handleEnableEditing() {
    startTransition(async () => {
      try {
        await enableMirrorEditing(employeeId, period)
        toast({
          title: "Edições liberadas",
          description: "Agora você pode ajustar batidas e aplicar abonos neste período.",
        })
        router.refresh()
      } catch (error) {
        console.error(error)
        toast({
          title: "Não foi possível liberar a edição",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        })
      }
    })
  }

  function handleConfirmMirror() {
    startTransition(async () => {
      try {
        const mirror = await confirmMirrorChanges(employeeId, period)
        toast({
          title: "Espelho confirmado",
          description: "O período foi fechado e o PDF tratado será aberto em seguida.",
        })
        router.push(`/rh/ponto/espelho/${mirror.id}?autoDownload=1`)
        router.refresh()
      } catch (error) {
        console.error(error)
        toast({
          title: "Não foi possível confirmar o espelho",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleEnableEditing}
        disabled={isPending || payrollLocked}
        className="rounded-full h-12 px-6 bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest gap-2"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
        {mirrorStatus === "EDITING" || mirrorStatus === "ADJUSTED"
          ? "Edição Liberada"
          : "Habilitar Edições"}
      </Button>

      <Button
        type="button"
        onClick={handleConfirmMirror}
        disabled={isPending || payrollLocked}
        className="rounded-full h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 font-black text-[10px] uppercase tracking-widest gap-2"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
        Confirmar Espelho
      </Button>



      {mirrorId && mirrorStatus === "APPROVED" && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/rh/ponto/espelho/${mirrorId}`)}
          className="rounded-full h-12 px-6 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Ver Espelho Fechado
        </Button>
      )}
    </div>
  )
}
