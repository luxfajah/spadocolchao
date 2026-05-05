"use client"

import { useState, useMemo } from "react"
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  X,
  Lock,
  ChevronDown,
  LayoutGrid
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface Permission {
  id: string
  name: string
  code: string
  module: string
  description?: string
}

interface PermissionPopupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (selectedIds: string[]) => void
  allPermissions: Permission[]
  initialSelectedIds: string[]
  inheritedIds?: string[] // Permissions already coming from the Role
  userName?: string
}

export function PermissionPopup({ 
  isOpen, 
  onClose, 
  onSave, 
  allPermissions, 
  initialSelectedIds,
  inheritedIds = [],
  userName
}: PermissionPopupProps) {
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)

  const groupedPermissions = useMemo(() => {
    const modules: Record<string, Permission[]> = {}
    
    allPermissions.forEach(p => {
      const match = p.name.toLowerCase().includes(search.toLowerCase()) || 
                    p.module.toLowerCase().includes(search.toLowerCase()) ||
                    p.code.toLowerCase().includes(search.toLowerCase())
      
      if (match) {
        if (!modules[p.module]) modules[p.module] = []
        modules[p.module].push(p)
      }
    })
    
    return modules
  }, [allPermissions, search])

  const handleToggle = (id: string) => {
    if (inheritedIds.includes(id)) return // Can't toggle inherited
    
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2.5rem] border-slate-200 shadow-2xl">
        <DialogHeader className="p-8 pb-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black font-heading italic uppercase tracking-tight text-slate-900">
                Acessos de {userName || "Usuário"}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">
                Selecione as funções e módulos que este usuário pode acessar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por módulo, função ou código..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-6 rounded-2xl border-slate-200 bg-slate-50 shadow-none focus:bg-white transition-all ring-offset-0 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-8">
            {Object.entries(groupedPermissions).map(([moduleName, permissions]) => (
              <div key={moduleName} className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-900">
                    {moduleName}
                  </h3>
                  <div className="h-px bg-slate-100 flex-1 ml-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions.map((p) => {
                    const isInherited = inheritedIds.includes(p.id)
                    const isSelected = selectedIds.includes(p.id) || isInherited

                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleToggle(p.id)}
                        className={cn(
                          "relative group flex flex-col p-4 rounded-2xl border transition-all cursor-pointer",
                          isSelected 
                            ? "bg-white border-primary shadow-sm ring-1 ring-primary/10" 
                            : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50",
                          isInherited && "opacity-80 bg-slate-50 cursor-not-allowed grayscale-[0.3]"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Checkbox 
                            id={p.id} 
                            checked={isSelected}
                            disabled={isInherited}
                            className={cn(
                              "h-5 w-5 rounded-md",
                              isInherited && "border-slate-300 bg-slate-200 text-slate-400"
                            )}
                          />
                          {isInherited && (
                            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 border border-slate-200 group-hover:bg-white transition-colors">
                              <Lock className="h-2.5 w-2.5 text-slate-400" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Do Cargo</span>
                            </div>
                          )}
                        </div>
                        
                        <label 
                          htmlFor={p.id}
                          className="cursor-pointer select-none"
                        >
                          <p className="font-bold text-slate-900 text-[13px] leading-tight mb-1 group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest opacity-60">
                            {p.code}
                          </p>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between sm:justify-between">
          <div className="hidden md:flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seleção atual</p>
            <p className="text-xs font-bold text-slate-900">
              {selectedIds.length} adicionais • {inheritedIds.length} herdadas
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="rounded-2xl border-slate-200 h-10 px-6 text-[10px] font-black uppercase tracking-widest"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => onSave(selectedIds)}
              className="rounded-2xl bg-slate-950 hover:bg-slate-900 text-white h-10 px-8 text-[10px] font-black uppercase tracking-widest italic"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
