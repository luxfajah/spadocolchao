"use client"

import { useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FileOutput, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

import { issueApprovedMirrorPdf } from "../actions"

type ApprovedMirrorPdfButtonProps = {
  mirrorId: string
  disabled?: boolean
  className?: string
  label?: string
  autoOpen?: boolean
}

export function ApprovedMirrorPdfButton({
  mirrorId,
  disabled = false,
  className,
  label = "Imprimir Espelho",
  autoOpen = false,
}: ApprovedMirrorPdfButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const hasAutoOpenedRef = useRef(false)

  function handleIssuePdf() {
    startTransition(async () => {
      try {
        const result = await issueApprovedMirrorPdf(mirrorId)
        if (typeof window !== "undefined") {
          const downloadLink = document.createElement("a")
          downloadLink.href = result.fileUrl
          downloadLink.download = `${result.documentName}.pdf`
          downloadLink.rel = "noopener"
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }

        toast({
          title: "Espelho aprovado baixado",
          description: "O PDF oficial foi salvo nos documentos do colaborador e baixado para envio ou impressão.",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Não foi possível emitir o PDF",
          description: error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        })
      }
    })
  }

  useEffect(() => {
    if (!autoOpen || hasAutoOpenedRef.current) {
      return
    }

    hasAutoOpenedRef.current = true
    handleIssuePdf()
  }, [autoOpen])

  function handleButtonClick() {
    handleIssuePdf()
  }

  return (
    <Button
      type="button"
      onClick={handleButtonClick}
      disabled={disabled || isPending}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Emitindo...
        </>
      ) : (
        <>
          <FileOutput className="h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  )
}
