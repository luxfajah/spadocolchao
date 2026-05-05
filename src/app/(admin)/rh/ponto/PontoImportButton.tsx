"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileInput } from "lucide-react"
import { cn } from "@/lib/utils"
import { ImportarPontoModal } from "../components/ImportarPontoModal"

export function PontoImportButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-white",
          className
        )}
      >
        <FileInput className="h-4 w-4" />
        Importar TXT do Relógio
      </Button>
      <ImportarPontoModal open={open} onOpenChange={setOpen} />
    </>
  )
}
