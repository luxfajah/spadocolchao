"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Bell, ChevronRight, Home, LogOut, Menu, Settings, ShieldCheck, Store, UserRound, Wallet } from "lucide-react"
import { logout } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AppArea } from "@/lib/role-presets"
import { cn } from "@/lib/utils"

type TopbarProps = {
  onMenuButtonClick?: () => void
  user: {
    name: string
    email: string | null
    username: string
    avatarUrl: string | null
    roleLabel: string
  }
  access: {
    allowedAreas: AppArea[]
    canAccessSettings: boolean
    homeHref: string
  }
}

type QuickAction = {
  label: string
  description: string
  href: string
  icon: LucideIcon
  className: string
}

const dashboardShortcutMap: Array<{
  area: AppArea
  label: string
  description: string
  href: string
  icon: LucideIcon
  className: string
}> = [
  {
    area: "dashboard",
    label: "Início",
    description: "Visão geral",
    href: "/dashboard",
    icon: Home,
    className: "border-slate-200 bg-white text-slate-700 hover:border-primary/20 hover:bg-primary/5 hover:text-primary",
  },
  {
    area: "pdv",
    label: "PDV",
    description: "Frente de caixa",
    href: "/pdv",
    icon: Store,
    className: "border-blue-100 bg-blue-50/80 text-blue-700 hover:bg-blue-100",
  },
  {
    area: "financial",
    label: "Financeiro",
    description: "Contas e caixa",
    href: "/financeiro/dashboard",
    icon: Wallet,
    className: "border-emerald-100 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100",
  },
  {
    area: "hr",
    label: "RH",
    description: "Equipe e ponto",
    href: "/rh/dashboard",
    icon: ShieldCheck,
    className: "border-amber-100 bg-amber-50/80 text-amber-700 hover:bg-amber-100",
  },
  {
    area: "settings",
    label: "Configurações",
    description: "Ajustes do ERP",
    href: "/configuracoes",
    icon: Settings,
    className: "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200",
  },
] as const

function getInitials(name: string, username: string) {
  const source = name.trim() || username.trim() || "US"
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "US"
}

function buildQuickActions(access: TopbarProps["access"]) {
  const actions = dashboardShortcutMap
    .filter((shortcut) => {
      if (shortcut.area === "dashboard") return true
      if (shortcut.area === "settings") return access.canAccessSettings || access.allowedAreas.includes("settings")
      return access.allowedAreas.includes(shortcut.area)
    })
    .map((shortcut) => ({
      ...shortcut,
      href: shortcut.area === "dashboard" ? access.homeHref : shortcut.href,
    }))

  return actions.slice(0, 5)
}

export function Topbar({ onMenuButtonClick, user, access }: TopbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)
  const userInitials = useMemo(() => getInitials(user.name, user.username), [user.name, user.username])
  const quickActions = useMemo(() => buildQuickActions(access), [access])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const previousScrollY = lastScrollYRef.current

      if (currentScrollY <= 24) {
        setIsVisible(true)
      } else if (currentScrollY > previousScrollY + 8) {
        setIsVisible(false)
      } else if (currentScrollY < previousScrollY - 8) {
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div className="sticky top-0 z-40 h-16">
      <header
        className={cn(
          "absolute inset-x-0 top-0 transition-all duration-300 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
        )}
      >
        <div className="pointer-events-none absolute inset-y-0 left-[calc(50%-50vw)] w-screen bg-[linear-gradient(180deg,rgba(240,244,248,0.98)_0%,rgba(240,244,248,0.88)_42%,rgba(240,244,248,0)_100%)]" />

        <div className="relative flex h-16 items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"
              onClick={onMenuButtonClick}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden items-center gap-3 xl:flex">
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Perfil ativo
              </div>
              <div className="min-w-0 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm">
                <p className="truncate text-sm font-black uppercase tracking-tight text-slate-950">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email || `@${user.username}`}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={14}
                className="w-[22rem] overflow-hidden rounded-[2rem] border-slate-100 p-0 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.45)]"
              >
                <div className="border-b border-slate-100 bg-slate-950 px-5 py-5 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                    Central de Alertas
                  </p>
                  <h3 className="mt-2 font-outfit text-2xl font-black uppercase tracking-tight">
                    Notificações
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    O painel completo de notificações será conectado nas próximas etapas do sistema.
                  </p>
                </div>

                <div className="space-y-3 p-5">
                  <DropdownMenuItem className="p-0 hover:bg-transparent focus:bg-transparent cursor-default select-none transition-none">
                    <div className="w-full rounded-[1.5rem] border border-blue-100 bg-blue-50/80 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                        Em breve
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Alertas de pedidos, fluxo financeiro, RH e segurança aparecerão aqui.
                      </p>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {access.canAccessSettings ? (
              <Link href="/configuracoes">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 md:inline-flex"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-12 items-center gap-3 rounded-[1.6rem] border border-slate-200 bg-white px-2.5 pr-3 shadow-sm transition-all hover:border-primary/15 hover:bg-primary/5"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[1.1rem] bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/15">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={`Foto de ${user.name}`} className="h-full w-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="hidden min-w-0 text-left md:block">
                    <p className="truncate text-xs font-black uppercase tracking-tight text-slate-900">
                      {user.name}
                    </p>
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {user.roleLabel}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={14}
                className="w-[min(24rem,calc(100vw-1.5rem))] max-h-none overflow-hidden rounded-[2rem] border-slate-100 bg-white p-0 shadow-[0_26px_90px_-42px_rgba(15,23,42,0.5)]"
              >
                <div className="relative overflow-hidden bg-slate-950 px-5 pb-5 pt-5 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.22),transparent_28%)]" />
                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 text-lg font-black shadow-xl backdrop-blur-sm">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={`Foto de ${user.name}`} className="h-full w-full object-cover" />
                        ) : (
                          userInitials
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                          Conta
                        </p>
                        <h3 className="mt-2 truncate font-outfit text-2xl font-black uppercase tracking-tight">
                          {user.name}
                        </h3>
                        <p className="mt-1 truncate text-sm text-slate-300">
                          {user.email || `@${user.username}`}
                        </p>
                        <span className="mt-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                          {user.roleLabel}
                        </span>
                      </div>

                      <DropdownMenuItem asChild>
                        <button
                          type="button"
                          onClick={() => logout()}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/10 text-white transition-all hover:bg-white/15 cursor-pointer focus:bg-white/20 outline-none"
                          aria-label="Sair do sistema"
                          title="Sair"
                        >
                          <LogOut className="h-4 w-4" />
                        </button>
                      </DropdownMenuItem>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/perfil"
                      className="group flex items-center justify-between rounded-[1.45rem] border border-slate-200 bg-white px-4 py-3 transition-all duration-300 hover:border-primary/15 hover:bg-primary/5 cursor-pointer outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-slate-100 text-slate-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                          <UserRound className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black uppercase tracking-tight text-slate-900">
                            Meu perfil
                          </span>
                          <span className="block truncate text-[11px] font-semibold text-slate-500">
                            Ver dados da sua conta
                          </span>
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  </DropdownMenuItem>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Atalhos
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {quickActions.map((action) => {
                        return (
                          <DropdownMenuItem asChild key={`${action.label}-${action.href}`}>
                            <Link
                              href={action.href}
                              className={cn(
                                "group flex h-full min-h-[108px] flex-col justify-between rounded-[1.35rem] border p-4 transition-all duration-300 cursor-pointer outline-none",
                                action.className,
                              )}
                              title={`${action.label} — ${action.description}`}
                              aria-label={`${action.label}. ${action.description}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-[1.05rem] border border-slate-200 bg-white/70">
                                  <action.icon className="h-4 w-4" />
                                </span>
                                <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                              </div>

                              <div className="mt-3 min-w-0">
                                <p className="truncate text-[13px] font-black uppercase tracking-tight">
                                  {action.label}
                                </p>
                                <p className="mt-1 hidden h-10 overflow-hidden text-[11px] font-semibold leading-5 opacity-80 sm:[display:-webkit-box] sm:[-webkit-line-clamp:2] sm:[-webkit-box-orient:vertical]">
                                  {action.description}
                                </p>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}

                      <DropdownMenuItem asChild>
                        <button
                          type="button"
                          onClick={() => logout()}
                          className={cn(
                            "group flex h-full min-h-[108px] flex-col justify-between rounded-[1.35rem] border p-4 text-left transition-all duration-300 cursor-pointer outline-none",
                            (quickActions.length + 1) % 2 === 1 && "col-span-2",
                            "border-rose-100 bg-rose-50/80 text-rose-700 hover:bg-rose-100",
                          )}
                          title="Sair — Encerrar sessão"
                          aria-label="Sair. Encerrar sessão"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-[1.05rem] border border-rose-200 bg-white/70 text-rose-700">
                              <LogOut className="h-4 w-4" />
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                          </div>

                          <div className="mt-3 min-w-0">
                            <p className="truncate text-[13px] font-black uppercase tracking-tight">
                              Sair
                            </p>
                            <p className="mt-1 hidden h-10 overflow-hidden text-[11px] font-semibold leading-5 opacity-80 sm:[display:-webkit-box] sm:[-webkit-line-clamp:2] sm:[-webkit-box-orient:vertical]">
                              Encerrar sessão
                            </p>
                          </div>
                        </button>
                      </DropdownMenuItem>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </div>
  )
}
