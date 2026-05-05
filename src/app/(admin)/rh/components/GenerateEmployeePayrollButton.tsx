"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

import { generateEmployeePayroll, issuePayrollPdf } from "../folha/actions"

type GenerateEmployeePayrollButtonProps = {
  employeeId: string
  period: string
  attendanceMirrorId?: string
  className?: string
  label?: string
  disabled?: boolean
}

export function GenerateEmployeePayrollButton({
  employeeId,
  period,
  attendanceMirrorId,
  className,
  label = "Gerar Holerite",
  disabled = false,
}: GenerateEmployeePayrollButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    startTransition(async () => {
      try {
        const result = await generateEmployeePayroll(employeeId, period, attendanceMirrorId)
        let pdfIssued = false

        try {
          const pdfResult = await issuePayrollPdf(result.payrollId)

          if (typeof window !== "undefined") {
            const downloadLink = document.createElement("a")
            downloadLink.href = pdfResult.fileUrl
            downloadLink.download = `${pdfResult.documentName}.pdf`
            downloadLink.rel = "noopener"
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
          }

          pdfIssued = true
        } catch (pdfError) {
          toast({
            title: "Holerite gerado sem PDF",
            description:
              pdfError instanceof Error
                ? pdfError.message
                : "O registro da folha foi criado, mas o PDF não conseguiu ser emitido agora.",
            variant: "destructive",
          })
        }

        toast({
          title: result.created ? "Holerite gerado" : "Holerite reaproveitado",
          description: pdfIssued
            ? `O PDF oficial da competência ${result.period} foi baixado e arquivado no funcionário.`
            : `A competência ${result.period} foi registrada na folha.`,
        })

        router.push(
          `/rh/folha?period=${encodeURIComponent(result.period)}&funcionario=${encodeURIComponent(employeeId)}`
        )
        router.refresh()
      } catch (error) {
        console.error(error)
        toast({
          title: "Não foi possível gerar o holerite",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button
      type="button"
      onClick={handleGenerate}
      disabled={isPending || disabled}
      className={cn(
        "rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 gap-2 transition-all hover:scale-105 active:scale-95",
        (isPending || disabled) && "hover:scale-100 active:scale-100 opacity-60",
        className
      )}
    >
      <Receipt className="h-3.5 w-3.5" />
      {isPending ? "Gerando..." : label}
    </Button>
  )
}
