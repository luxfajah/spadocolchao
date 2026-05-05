"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { issuePayrollPdf } from "../folha/actions"

type PayrollPdfButtonProps = {
  payrollId: string
  disabled?: boolean
  className?: string
  label?: string
}

function triggerBrowserDownload(fileUrl: string, documentName: string) {
  if (typeof window === "undefined") {
    return
  }

  const downloadLink = document.createElement("a")
  downloadLink.href = fileUrl
  downloadLink.download = `${documentName}.pdf`
  downloadLink.rel = "noopener"
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

export function PayrollPdfButton({
  payrollId,
  disabled = false,
  className,
  label = "Baixar Holerite",
}: PayrollPdfButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = React.useTransition()

  function handleIssuePdf() {
    startTransition(async () => {
      try {
        const result = await issuePayrollPdf(payrollId)
        triggerBrowserDownload(result.fileUrl, result.documentName)

        toast({
          title: "Holerite emitido",
          description: "O PDF completo foi salvo nos documentos do colaborador e baixado para uso imediato.",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Não foi possível emitir o holerite",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button
      type="button"
      onClick={handleIssuePdf}
      disabled={disabled || isPending}
      className={cn(className)}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Emitindo...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}
