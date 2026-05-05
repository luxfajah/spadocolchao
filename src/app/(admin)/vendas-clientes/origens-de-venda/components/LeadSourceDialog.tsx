"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { upsertLeadSource } from "../actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

interface LeadSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source?: any // If editing
  onSuccess: () => void
}

export function LeadSourceDialog({ open, onOpenChange, source, onSuccess }: LeadSourceDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: "",
    code: "",
    category: "OUTRO",
    description: "",
    isActive: true,
    isDefaultPdv: false,
    requiresDetail: false,
    commissionEligible: true,
    priority: 0,
    estimatedCost: 0
  })

  useEffect(() => {
    if (source) {
      setFormData({
        id: source.id,
        name: source.name || "",
        code: source.code || "",
        category: source.category || "OUTRO",
        description: source.description || "",
        isActive: source.isActive ?? true,
        isDefaultPdv: source.isDefaultPdv ?? false,
        requiresDetail: source.requiresDetail ?? false,
        commissionEligible: source.commissionEligible ?? true,
        priority: source.priority ?? 0,
        estimatedCost: source.estimatedCost ?? 0
      })
    } else {
      setFormData({
        name: "",
        code: "",
        category: "OUTRO",
        description: "",
        isActive: true,
        isDefaultPdv: false,
        requiresDetail: false,
        commissionEligible: true,
        priority: 0,
        estimatedCost: 0
      })
    }
  }, [source, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await upsertLeadSource(formData)
    
    if (result.success) {
      toast({ title: source ? "Origem atualizada" : "Origem criada com sucesso" })
      onSuccess()
      onOpenChange(false)
    } else {
      toast({ 
        title: "Erro ao salvar", 
        description: result.error, 
        variant: "destructive" 
      })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="bg-slate-900 p-8 text-white relative">
             <DialogHeader>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase tracking-widest">{source ? 'Editar Origem' : 'Nova Origem de Venda'}</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Configuração de canal de captação comercial</DialogDescription>
             </DialogHeader>
          </div>

          <div className="p-8 space-y-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome da Origem</Label>
                <Input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="rounded-2xl h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-xs" 
                  placeholder="Ex: Instagram Ads"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código (Identificador)</Label>
                <Input 
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  className="rounded-2xl h-12 border-slate-100 bg-slate-50 focus:bg-white transition-all font-bold text-xs"
                  placeholder="Ex: INSTA_ADS"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
                <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                   <SelectTrigger className="rounded-2xl h-12 border-slate-100 bg-slate-50 font-bold text-xs">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl">
                      <SelectItem value="Digital paga">Digital paga</SelectItem>
                      <SelectItem value="Digital orgânica">Digital orgânica</SelectItem>
                      <SelectItem value="Loja física">Loja física</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Campanha">Campanha</SelectItem>
                      <SelectItem value="Externa">Externa</SelectItem>
                      <SelectItem value="Parceria">Parceria</SelectItem>
                      <SelectItem value="Reativação">Reativação</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prioridade (0-10)</Label>
                <Input 
                  type="number"
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                  className="rounded-2xl h-12 border-slate-100 bg-slate-50 font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição / Observações</Label>
              <Textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="rounded-2xl min-h-[100px] border-slate-100 bg-slate-50 font-medium text-xs resize-none"
                placeholder="Detalhes sobre esta origem..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
               <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:border-indigo-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Ativo</span>
                     <span className="text-[9px] text-slate-400 font-bold uppercase italic mt-0.5">Disponível para seleção</span>
                  </div>
                  <Switch 
                    checked={formData.isActive} 
                    onCheckedChange={v => setFormData({...formData, isActive: v})} 
                  />
               </div>
               <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:border-emerald-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Padrão PDV</span>
                     <span className="text-[9px] text-slate-400 font-bold uppercase italic mt-0.5">Selecionar por padrão</span>
                  </div>
                  <Switch 
                    checked={formData.isDefaultPdv} 
                    onCheckedChange={v => setFormData({...formData, isDefaultPdv: v})} 
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:border-amber-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exigir Detalhe</span>
                     <span className="text-[9px] text-slate-400 font-bold uppercase italic mt-0.5">Obrigatório no fechamento</span>
                  </div>
                  <Switch 
                    checked={formData.requiresDetail} 
                    onCheckedChange={v => setFormData({...formData, requiresDetail: v})} 
                  />
               </div>
               <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:border-purple-100">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gera Comissão</span>
                     <span className="text-[9px] text-slate-400 font-bold uppercase italic mt-0.5">Elegível para cálculos</span>
                  </div>
                  <Switch 
                    checked={formData.commissionEligible} 
                    onCheckedChange={v => setFormData({...formData, commissionEligible: v})} 
                  />
               </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-2xl h-14 px-8 font-black text-[10px] uppercase tracking-widest hover:bg-white"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-2xl h-14 px-10 gap-2 bg-slate-900 hover:bg-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {source ? 'Salvar Alterações' : 'Criar Origem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
