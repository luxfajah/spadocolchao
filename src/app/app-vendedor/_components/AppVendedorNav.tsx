"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, LayoutGrid, Calendar, Plus, X, Wallet, History, Target } from "lucide-react"
import { useState } from "react"

const mainNav = [
  { href: "/app-vendedor/pdv",     icon: ShoppingCart, label: "PDV" },
  { href: "/app-vendedor/kanban",  icon: LayoutGrid,   label: "Pedidos" },
  { href: "/app-vendedor/visitas", icon: Calendar,     label: "Visitas" },
]

const moreNav = [
  { href: "/app-vendedor/saldo",    icon: Wallet,  label: "Saldo" },
  { href: "/app-vendedor/historico",icon: History,  label: "Histórico" },
  { href: "/app-vendedor/metas",    icon: Target,   label: "Metas" },
]

export function AppVendedorNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isMoreActive = moreNav.some(n => pathname.startsWith(n.href))

  return (
    <>
      {/* Overlay ao abrir o menu + */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Menu popup do + */}
      {open && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center animate-in slide-in-from-bottom-4 duration-200">
          {moreNav.map(item => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-2 pt-2 pb-safe-or-2">
        {mainNav.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-1 gap-0.5 transition-all ${
                active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-blue-50" : ""}`}>
                <Icon size={20} />
              </div>
              <span className={`text-[10px] font-bold ${active ? "text-blue-600" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Botão + */}
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex flex-col items-center justify-center w-full py-1 gap-0.5 transition-all ${
            isMoreActive || open ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${isMoreActive || open ? "bg-blue-50" : ""}`}>
            {open ? <X size={20} /> : <Plus size={20} />}
          </div>
          <span className={`text-[10px] font-bold ${isMoreActive || open ? "text-blue-600" : "text-slate-400"}`}>
            {isMoreActive ? moreNav.find(n => pathname.startsWith(n.href))?.label : "Mais"}
          </span>
        </button>
      </nav>
    </>
  )
}
