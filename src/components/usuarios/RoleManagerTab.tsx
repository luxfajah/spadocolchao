"use client"

import { useState } from "react"
import { 
  Shield, 
  Users, 
  Settings2, 
  Copy, 
  Trash2, 
  Plus,
  ArrowRight,
  ShieldCheck,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/configuracoes/ConfigShell"
import { cn } from "@/lib/utils"

interface Role {
  id: string
  name: string
  description: string | null
  status: string
  isSystem: boolean
  users: { id: string }[]
  permissions: { permissionId: string }[]
}

interface RoleManagerTabProps {
  roles: Role[]
  onEditPermissions: (role: Role) => void
  onDuplicate: (roleId: string) => void
  onStatusChange: (roleId: string, status: string) => void
  onNewRole: () => void
}

export function RoleManagerTab({ 
  roles, 
  onEditPermissions, 
  onDuplicate, 
  onStatusChange,
  onNewRole
}: RoleManagerTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 p-6 rounded-[2.25rem] border border-slate-200 shadow-sm backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-black font-heading italic uppercase tracking-tight text-slate-900 leading-none mb-2">
            Cargos e Perfis de Acesso
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 opacity-70">
            Defina os moldes de permissão que serão atribuídos aos colaboradores.
          </p>
        </div>
        <Button 
          onClick={onNewRole}
          className="rounded-2xl bg-primary text-white h-12 px-8 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Cargo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="rounded-[2.25rem] border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4 relative">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
                  role.isSystem ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-100"
                )}>
                  <Shield className="h-6 w-6" />
                </div>
                <StatusBadge status={role.status} />
              </div>
              
              <div className="space-y-1">
                <CardTitle className="text-xl font-black font-heading italic uppercase tracking-tight text-slate-900">
                  {role.name}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 line-clamp-2 min-h-[32px]">
                  {role.description || "Nenhuma descrição definida para este perfil."}
                </CardDescription>
              </div>

              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-xl w-48">
                    <DropdownMenuItem onClick={() => onDuplicate(role.id)} className="rounded-xl p-3 gap-3 cursor-pointer">
                      <Copy className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700">Duplicar Base</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onStatusChange(role.id, role.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE")}
                      className="rounded-xl p-3 gap-3 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs font-bold">Arquivar Cargo</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-0">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-3 w-3 text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Membros</span>
                  </div>
                  <p className="text-2xl font-black font-heading italic text-slate-900 leading-none">
                    {role.users.length}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-3 w-3 text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Funções</span>
                  </div>
                  <p className="text-2xl font-black font-heading italic text-slate-900 leading-none">
                    {role.permissions.length}
                  </p>
                </div>
              </div>

              <Button 
                onClick={() => onEditPermissions(role)}
                className="w-full h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 font-black uppercase tracking-widest text-[10px] group/btn transition-all"
              >
                <Settings2 className="mr-2 h-4 w-4 group-hover/btn:rotate-45 transition-transform" />
                Configurar Matriz
                <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <button 
          onClick={onNewRole}
          className="group flex flex-col items-center justify-center p-8 rounded-[2.25rem] border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all text-slate-400 hover:text-primary min-h-[300px]"
        >
          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 group-hover:bg-white flex items-center justify-center shadow-inner group-hover:shadow-md transition-all mb-4">
            <Plus className="h-8 w-8" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest">Criar Molde Personalizado</p>
          <p className="text-xs font-semibold opacity-60 mt-2 max-w-[200px] text-center italic">
            Parta de uma base vazia ou use um preset do sistema.
          </p>
        </button>
      </div>
    </div>
  )
}
