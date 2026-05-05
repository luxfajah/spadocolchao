"use client"

import { Inter } from "next/font/google"
import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"] })

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="antialiased min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Erro Crítico</h1>
            <p className="text-slate-500">
              Infelizmente, ocorreu um erro inesperado e não conseguimos renderizar a página.
            </p>
          </div>

          <div className="bg-slate-100 rounded-lg p-4 text-left overflow-x-auto text-xs font-mono text-slate-700">
            {error.message || "Erro desconhecido"}
          </div>

          <Button 
            onClick={() => reset()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            size="lg"
          >
            <RefreshCcw className="w-4 h-4" />
            Tentar Recarregar
          </Button>
        </div>
      </body>
    </html>
  )
}
