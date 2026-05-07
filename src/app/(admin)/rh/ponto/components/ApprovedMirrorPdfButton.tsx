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
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary"
}

export function ApprovedMirrorPdfButton({
  mirrorId,
  disabled = false,
  className,
  label = "Imprimir Espelho",
  autoOpen = false,
  icon,
  variant = "default",
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
          const newWindow = window.open(result.fileUrl, "_blank")
          if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            // Popup blocked
            toast({
              title: "Popup Bloqueado",
              description: (
                <div className="flex flex-col gap-2">
                  <p>O navegador bloqueou a abertura automática. Clique abaixo para abrir:</p>
                  <a 
                    href={result.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 underline font-bold"
                  >
                    Abrir PDF Oficial
                  </a>
                </div>
              ),
            })
          } else {
            toast({
              title: "Espelho Gerado",
              description: "O PDF oficial foi aberto em uma nova aba e salvo no prontuário.",
            })
          }
        }

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
      variant={variant as any}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Emitindo...
        </>
      ) : (
        <>
          {icon || <FileOutput className="h-4 w-4" />}
          {label}
        </>
      )}
    </Button>
  )
}
