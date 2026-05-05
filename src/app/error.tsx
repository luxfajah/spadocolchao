"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error("Root Application Error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
      <div className="bg-red-50 p-6 rounded-full mb-6 ring-1 ring-red-200">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      
      <h2 className="text-3xl font-black uppercase italic tracking-tight text-slate-900 mb-2">
        Falha Crítica no Sistema
      </h2>
      <p className="text-slate-500 max-w-md mb-8 font-medium">
        O sistema encontrou um problema inesperado que impediu o carregamento da página.
      </p>

      {error.message && (
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl mb-8 max-w-xl w-full text-left font-mono text-sm text-red-700 overflow-auto max-h-60">
          <p className="font-bold mb-2">Detalhes do erro:</p>
          <pre className="whitespace-pre-wrap break-all">{error.message}</pre>
          {error.digest && <p className="mt-4 text-[10px] text-slate-400">ID do Erro: {error.digest}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => reset()}
          className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 rounded-2xl px-8 h-12 font-bold uppercase tracking-tight"
        >
          <RefreshCcw className="w-4 h-4" />
          Tentar Novamente
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.href = '/dashboard'}
          className="rounded-2xl px-8 h-12 font-bold uppercase tracking-tight"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  )
}
