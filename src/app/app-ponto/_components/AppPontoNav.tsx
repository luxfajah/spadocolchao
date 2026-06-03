"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Clock, History, LogOut } from "lucide-react"
import { logout } from "@/app/login/actions"

export function AppPontoNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/app-ponto", icon: Clock, label: "Ponto" },
    { href: "/app-ponto/historico", icon: History, label: "Histórico" },
  ]

  const handleLogout = async () => {
    if (confirm("Deseja realmente sair do aplicativo?")) {
      await logout()
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 flex items-center justify-around px-4 pt-2.5 pb-safe-or-3.5 shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon
        // Check if exact match or subroute
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full py-1.5 gap-1 transition-all duration-300 relative ${
              active ? "text-cyan-400 scale-105" : "text-slate-500 hover:text-slate-350"
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all duration-300 ${
              active ? "bg-cyan-500/10 shadow-lg shadow-cyan-500/5" : ""
            }`}>
              <Icon size={20} className={active ? "stroke-[2.5px]" : "stroke-[2px]"} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
              active ? "text-cyan-400 font-bold" : "text-slate-500"
            }`}>
              {item.label}
            </span>
            {active && (
              <div className="absolute top-0 w-8 h-[3px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
            )}
          </Link>
        )
      })}

      {/* Botão de Sair */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center justify-center w-full py-1.5 gap-1 text-slate-500 hover:text-red-400 transition-all duration-300"
      >
        <div className="p-2 rounded-2xl hover:bg-red-500/10 transition-all duration-300">
          <LogOut size={20} className="stroke-[2px]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
          Sair
        </span>
      </button>
    </nav>
  )
}
