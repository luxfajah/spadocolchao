"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { MobileNav } from "@/components/layout/MobileNav"
import type { AppArea } from "@/lib/role-presets"

type AdminShellProps = {
  children: React.ReactNode
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
  hideNavigation?: boolean
}

export function AdminShell({ children, user, access, hideNavigation = false }: AdminShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((currentValue) => !currentValue)
  }

  if (hideNavigation) {
    return (
      <div className="flex min-h-screen bg-background relative w-full overflow-x-hidden">
        <main className="flex-1 text-foreground bg-background w-full">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background relative">
      {isMobileSidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"></div>}

      <div className="hidden lg:flex flex-1 justify-center items-start gap-4 pt-0 px-6">
        <div className="w-[20%] shrink-0 relative">
          <Sidebar
            className="fixed left-[2.5%] w-[18%]"
            allowedAreas={access.allowedAreas}
            homeHref={access.homeHref}
          />
        </div>

        <div className="w-[75%] flex flex-col min-w-0 pb-20 lg:pb-0">
          <Topbar user={user} access={access} onMenuButtonClick={toggleMobileSidebar} />
          <main className="flex-1 p-4 md:p-8 text-foreground bg-background">{children}</main>
        </div>
      </div>

      <div className="lg:hidden flex flex-1 flex-col relative w-full pb-20">
        <Topbar user={user} access={access} onMenuButtonClick={toggleMobileSidebar} />
        <main className="flex-1 p-4 text-foreground bg-background">{children}</main>
      </div>

      <MobileNav allowedAreas={access.allowedAreas} homeHref={access.homeHref} />
    </div>
  )
}
