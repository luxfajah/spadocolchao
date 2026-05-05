"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Truck, User, Phone, CheckCircle2 } from "lucide-react"
import { recordOrderDelivery } from "@/app/(admin)/vendas-clientes/pedidos/actions"
import { useToast } from "@/hooks/use-toast"

interface DeliveryModalProps {
  order: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeliveryModal({ order, open, onOpenChange, onSuccess }: DeliveryModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      recipientName: String(formData.get("recipientName")),
      recipientPhone: String(formData.get("recipientPhone")),
      notes: String(formData.get("notes")),
    }

    const result = await recordOrderDelivery(order.id, data)

    if (result.success) {
      toast({
        title: "Entrega Registrada",
        description: `O pedido #${order.code} foi marcado como entregue com sucesso.`,
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro ao registrar",
        description: result.error,
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-2">
            <Truck className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black font-outfit uppercase italic tracking-tight text-primary">
            Confirmar Entrega
          </DialogTitle>
          <DialogDescription className="font-bold text-slate-500 uppercase text-[11px] tracking-widest leading-relaxed">
            Preencha os dados do recebedor para finalizar a entrega do pedido <span className="text-primary">#{order?.code}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-6">
            <div className="space-y-3">
              <Label htmlFor="recipientName" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Nome de quem recebeu</Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                <Input 
                  id="recipientName" 
                  name="recipientName"
                  placeholder="Ex: João da Silva" 
                  required
                  defaultValue={order?.customer?.fullName}
                  className="pl-12 rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="recipientPhone" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Telefone de Contato</Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                <Input 
                  id="recipientPhone" 
                  name="recipientPhone"
                  placeholder="(00) 00000-0000" 
                  required
                  defaultValue={order?.customer?.phone}
                  className="pl-12 rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Observações da Entrega</Label>
              <Textarea 
                id="notes" 
                name="notes"
                placeholder="Ex: Deixado na portaria, conferido pelo cliente..." 
                className="rounded-2xl border-slate-100 bg-slate-50/50 font-medium min-h-[100px] p-4 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/50"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-full h-14 px-10 gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all font-black text-xs uppercase tracking-widest"
            >
              {loading ? "Processando..." : <><CheckCircle2 className="h-4 w-4" /> Finalizar Entrega</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
