import { requireAuthenticatedUser } from "@/lib/auth"
import { getUserAvatarUrl } from "@/lib/user-avatar"
import Link from "next/link"
import { ShoppingCart, LayoutGrid, Wallet, History, Target, Calendar } from "lucide-react"

export default async function AppVendedorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser()
  const avatarUrl = await getUserAvatarUrl(user.id)

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Header - opcional, mas útil para mostrar quem está logado */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{user.name}</span>
            <span className="text-xs text-slate-500">Vendedor App</span>
          </div>
        </div>
        <div className="flex items-center">
           <img src="/spa-logo.ico" alt="Logo" className="w-8 h-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around pb-safe pt-2 shrink-0 z-50">
        <NavItem href="/app-vendedor/pdv" icon={<ShoppingCart size={20} />} label="PDV" />
        <NavItem href="/app-vendedor/kanban" icon={<LayoutGrid size={20} />} label="Pedidos" />
        <NavItem href="/app-vendedor/saldo" icon={<Wallet size={20} />} label="Saldo" />
        <NavItem href="/app-vendedor/historico" icon={<History size={20} />} label="Histórico" />
        <NavItem href="/app-vendedor/metas" icon={<Target size={20} />} label="Metas" />
        <NavItem href="/app-vendedor/visitas" icon={<Calendar size={20} />} label="Visitas" />
      </nav>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center w-full py-1 text-slate-600 hover:text-blue-600 active:text-blue-700">
      <div className="mb-1">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  )
}
