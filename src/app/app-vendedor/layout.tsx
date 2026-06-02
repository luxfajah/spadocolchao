import { requireAuthenticatedUser } from "@/lib/auth"
import { AppVendedorNav } from "./_components/AppVendedorNav"

export default async function AppVendedorLayout({ children }: { children: React.ReactNode }) {
  // Garantimos a autenticação, mas não precisamos das infos de avatar pro top header
  await requireAuthenticatedUser()

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

