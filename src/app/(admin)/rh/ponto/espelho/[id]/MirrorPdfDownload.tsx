"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface MirrorPdfDownloadProps {
  mirrorId: string
  employeeName: string
  period: string
  autoDownload?: boolean
}

export function MirrorPdfDownload({
  mirrorId,
  employeeName,
  period,
  autoDownload = false,
}: MirrorPdfDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const hasAutoDownloadedRef = useRef(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const element = document.getElementById("mirror-content")
      if (!element) return

      // Hide buttons during capture
      const actions = document.getElementById("mirror-actions")
      if (actions) actions.style.display = "none"

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })

      if (actions) actions.style.display = "flex"

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Espelho_Ponto_${employeeName.replace(/\s+/g, '_')}_${period.replace(/\//g, '-')}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (!autoDownload || hasAutoDownloadedRef.current) {
      return
    }

    hasAutoDownloadedRef.current = true
    void handleDownload()
  }, [autoDownload])

  return (
    <Button 
      onClick={handleDownload}
      disabled={isGenerating}
      className="rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  )
}
