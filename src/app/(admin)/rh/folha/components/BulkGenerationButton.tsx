"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"
import { BulkGenerationModal } from "./BulkGenerationModal"

type BulkGenerationButtonProps = {
  period: string
  departments: string[]
}

export function BulkGenerationButton({ period, departments }: BulkGenerationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="rounded-full gap-2 bg-slate-900 hover:bg-black text-white shadow-lg transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.14em]"
      >
        <Layers className="h-4 w-4" /> Gerar em Bloco
      </Button>

      <BulkGenerationModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        period={period}
        departments={departments}
      />
    </>
  )
}
