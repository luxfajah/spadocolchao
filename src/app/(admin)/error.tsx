"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Admin Error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Não conseguimos carregar os dados desta página. Isso pode ser uma falha temporária ou um problema de conexão.
      </p>

      {error.message && (
        <div className="bg-slate-100 p-4 rounded-lg mb-8 max-w-md w-full overflow-hidden text-left text-xs text-slate-700 font-mono">
          <p className="truncate">{error.message}</p>
        </div>
      )}

      <Button 
        onClick={() => reset()}
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        size="lg"
      >
        <RefreshCw className="w-4 h-4" />
        Tentar Novamente
      </Button>
    </div>
  )
}
