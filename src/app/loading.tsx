import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin shadow-lg"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin opacity-40" />
        </div>
      </div>
      
      <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">
        Carregando...
      </p>
    </div>
  )
}
