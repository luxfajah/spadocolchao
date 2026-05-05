"use client"

import { useState } from "react"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCog, 
  UserX, 
  Clock, 
  Mail,
  Building2,
  ChevronRight
} from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/configuracoes/ConfigShell"
import { cn, formatDate } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string | null
  username: string
  status: string
  jobTitle: string | null
  department: string | null
  lastLoginAt: Date | string | null
  primaryRole?: { name: string }
}

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onStatusChange: (userId: string, status: string) => void
}

export function UserTable({ users, onEdit, onStatusChange }: UserTableProps) {
  const [search, setSearch] = useState("")

  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border shadow-sm">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Buscar por nome, e-mail ou prefixo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-6 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="rounded-2xl border-slate-200 text-slate-600 gap-2 h-12 px-6">
            <Filter className="h-4 w-4" />
            <span className="text-[11px] font-black uppercase tracking-widest">Filtros</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-b border-slate-100">
              <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Usuário</TableHead>
              <TableHead className="py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Acesso / Cargo</TableHead>
              <TableHead className="py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">Status</TableHead>
              <TableHead className="py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Último Acesso</TableHead>
              <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-300">
                      <Search className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-widest text-slate-900">Nenhum usuário encontrado</p>
                      <p className="text-sm text-slate-500 mt-1">Tente ajustar seus filtros ou busca.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                  <TableCell className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black text-lg shadow-sm group-hover:shadow-md transition-all">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate max-w-[200px] leading-tight mb-1">{user.name}</p>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px] uppercase tracking-widest font-semibold opacity-70">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{user.email || user.username}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                          {user.primaryRole?.name || "Sem Perfil"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-bold opacity-60">
                        <Building2 className="h-3 w-3" />
                        <span>{user.department || "Geral"}</span>
                        <span>•</span>
                        <span>{user.jobTitle || "Colaborador"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest">
                        {user.lastLoginAt ? (
                          <>
                            <p className="text-slate-900 leading-none mb-1">
                              {formatDate(user.lastLoginAt, "dd/MM/yyyy HH:mm")}
                            </p>
                            <p className="text-slate-500 opacity-60">Logado via Web</p>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Nunca acessou</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="rounded-xl border-slate-200 hover:border-primary hover:text-primary transition-all h-10 px-4 group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest mr-2">Configurar</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                            <MoreHorizontal className="h-5 w-5 text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400 p-3">Ações rápidas</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-xl p-3 gap-3 cursor-pointer">
                            <UserCog className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-bold text-slate-700">Editar Detalhes</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100" />
                          <DropdownMenuItem 
                            onClick={() => onStatusChange(user.id, user.status === "ACTIVE" ? "BLOCKED" : "ACTIVE")}
                            className="rounded-xl p-3 gap-3 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                          >
                            <UserX className="h-4 w-4" />
                            <span className="text-xs font-bold">
                              {user.status === "ACTIVE" ? "Bloquear Acesso" : "Desbloquear Acesso"}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
