"use client"

import { useState } from "react"
import { Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { generateBatchPayroll } from "../folha/actions"

export function GeneratePayrollButton({
  period,
  className,
}: {
  period: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const result = await generateBatchPayroll(period)
      alert(
        `Holerites processados para ${period}. ${result.generated} registro(s) gerado(s) a partir de ${result.approvedMirrors} espelho(s) aprovado(s).`
      )
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert("Ocorreu um erro ao gerar os holerites em lote.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className={cn(
        "rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white",
        className
      )}
    >
      <Calculator className="h-4 w-4" /> {loading ? "Processando..." : "Gerar Holerites em Lote"}
    </Button>
  )
}
