import { getAuthenticatedUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppPontoNav } from "./_components/AppPontoNav"
import { GeolocationProvider } from "@/components/GeolocationProvider"

export const metadata = {
  title: "Ponto - Spa do Colchão",
  description: "Registro de ponto do colaborador",
}

export default async function AppPontoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect("/login?redirect=/app-ponto")
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden">
      {/* GPS Shield - Blocks app if location permission is missing on native mobile */}
      <GeolocationProvider userId={user.id} />

      {/* Main App Container */}
      <main className="flex-1 overflow-y-auto pb-24 relative custom-scrollbar">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Bottom Bar */}
      <AppPontoNav />
    </div>
  )
}
