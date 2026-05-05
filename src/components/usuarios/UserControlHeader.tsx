"use client"

import { Users, UserPlus, ShieldCheck, UserMinus, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/PageHeader"
import { cn } from "@/lib/utils"

interface UserControlHeaderProps {
  stats: {
    total: number
    active: number
    pending: number
    blocked: number
  }
  onNewUser: () => void
}

export function UserControlHeader({ stats, onNewUser }: UserControlHeaderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Usuários"
        subtitle="Gestão de identidade, perfis de acesso e segurança da plataforma."
        icon={<Users className="h-8 w-8 text-primary" />}
        actions={
          <Button 
            onClick={onNewUser}
            className="rounded-full bg-slate-950 hover:bg-slate-900 text-white px-8 py-6 h-auto font-black uppercase tracking-[0.2em] italic text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Novo Usuário
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-1">
        <StatCard
          label="Total de Usuários"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          tone="slate"
        />
        <StatCard
          label="Usuários Ativos"
          value={stats.active}
          icon={<UserCheck className="h-5 w-5" />}
          tone="emerald"
        />
        <StatCard
          label="Aguardando Ativação"
          value={stats.pending}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Acesso Bloqueado"
          value={stats.blocked}
          icon={<UserMinus className="h-5 w-5" />}
          tone="red"
        />
      </div>
    </div>
  )
}

function StatCard({ 
  label, 
  value, 
  icon, 
  tone 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  tone: "slate" | "emerald" | "amber" | "red" 
}) {
  const toneStyles = {
    slate: "bg-slate-50 border-slate-200 text-slate-600",
    emerald: "bg-emerald-50/50 border-emerald-100 text-emerald-600",
    amber: "bg-amber-50/50 border-amber-100 text-amber-600",
    red: "bg-red-50/50 border-red-100 text-red-600",
  }

  return (
    <div className={cn(
      "p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-md",
      toneStyles[tone]
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center bg-white shadow-sm border",
          tone === "slate" ? "text-slate-400" : 
          tone === "emerald" ? "text-emerald-500 border-emerald-100" : 
          tone === "amber" ? "text-amber-500 border-amber-100" : 
          "text-red-500 border-red-100"
        )}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1 leading-none">
          {label}
        </p>
        <p className="text-3xl font-black font-heading italic tracking-tighter text-slate-900 leading-none">
          {value}
        </p>
      </div>
    </div>
  )
}
