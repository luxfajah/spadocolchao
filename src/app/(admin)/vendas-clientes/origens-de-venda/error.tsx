"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner">
        <AlertTriangle className="h-10 w-10" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-primary font-outfit uppercase italic tracking-tighter">Ops! Algo deu errado</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest max-w-sm mx-auto">
          Ocorreu um erro ao carregar o módulo de origens de venda.
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-mono text-slate-400 max-w-md overflow-auto border border-slate-100 italic">
        {error.message || "Erro desconhecido no servidor."}
      </div>

      <Button 
        onClick={() => reset()}
        className="rounded-full h-12 px-10 gap-2 bg-primary hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all"
      >
        <RefreshCcw className="h-4 w-4" /> Tentar Novamente
      </Button>
    </div>
  )
}
