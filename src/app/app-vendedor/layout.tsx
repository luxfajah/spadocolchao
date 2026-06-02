import { getAuthenticatedUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppVendedorNav } from "./_components/AppVendedorNav"

export default async function AppVendedorLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login?redirect=/app-vendedor/pdv")
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <AppVendedorNav />
    </div>
  )
}

