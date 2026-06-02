import { getAuthenticatedUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Map, Package, CheckSquare } from "lucide-react"
import Link from "next/link"

export default async function AppEntregadorLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login?redirect=/app-entregador")
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-50">
        <Link href="/app-entregador" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-sky-600">
          <Map className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Rotas do Dia</span>
        </Link>
      </nav>
    </div>
  )
}
