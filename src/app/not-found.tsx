import Link from "next/link"
import { Search, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="bg-blue-50 p-8 rounded-full mb-8 relative">
        <Search className="w-16 h-16 text-blue-500 relative z-10" />
        <div className="absolute top-0 right-0 -mr-2 -mt-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          404
        </div>
      </div>
      
      <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Página não encontrada</h2>
      <p className="text-slate-500 max-w-md mb-8 text-lg">
        Não conseguimos encontrar a página que você está procurando. Pode ter sido movida ou não existe mais.
      </p>

      <Link href="/dashboard" passHref>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm rounded-lg"
          size="lg"
        >
          <Home className="w-5 h-5" />
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  )
}
