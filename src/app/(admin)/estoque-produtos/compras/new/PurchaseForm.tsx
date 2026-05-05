"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPurchase } from "../actions"
import { Trash2, Plus } from "lucide-react"

type Supplier = { id: string; legalName: string; tradeName: string | null }
type SupplyItem = { 
  id: string; 
  name: string; 
  code: string | null; 
  unit: string;
  supplierSupplyItems: {
    supplierId: string;
    purchaseUnit: string;
    defaultUnitCost: number;
    leadTimeDays: number;
  }[]
}

export function PurchaseForm({ suppliers, supplyItems }: { suppliers: Supplier[], supplyItems: SupplyItem[] }) {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<{
    supplyItemId: string; quantity: number; unit: string; unitCost: number; totalCost: number;
  }[]>([])

  const addItem = () => {
    setItems([...items, { supplyItemId: "", quantity: 1, unit: "", unitCost: 0, totalCost: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, key: string, value: any) => {
    const newItems = [...items]
    const item = { ...newItems[index], [key]: value }
    
    // Autofill data when selecting supply item
    if (key === "supplyItemId" && value) {
      const supply = supplyItems.find(s => s.id === value)
      const link = supply?.supplierSupplyItems.find(l => l.supplierId === supplierId)
      if (link) {
        item.unit = link.purchaseUnit || supply?.unit || ""
        item.unitCost = link.defaultUnitCost || 0
      } else if (supply) {
        item.unit = supply.unit
      }
    }

    if (key === "quantity" || key === "unitCost" || key === "supplyItemId") {
      item.totalCost = (item.quantity || 0) * (item.unitCost || 0)
    }

    newItems[index] = item
    setItems(newItems)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || items.length === 0 || items.some(i => !i.supplyItemId || i.quantity <= 0)) {
      alert("Preencha fornecedor e adicione insumos válidos com quantidade > 0.")
      return
    }

    try {
      await createPurchase({
        supplierId,
        expectedDate: expectedDate || undefined,
        notes,
        items
      })
      router.push("/estoque-produtos/compras")
    } catch (err: any) {
      alert(err.message || "Erro ao criar compra")
    }
  }

  // Filter supplies based on selected supplier
  const availableSupplies = supplyItems.filter(s => 
    s.supplierSupplyItems.some(link => link.supplierId === supplierId)
  )

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold border-b border-border pb-2">Dados do Pedido</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplierId">Fornecedor</Label>
            <select required value={supplierId} onChange={e => { setSupplierId(e.target.value); setItems([]) }} className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card hover:bg-muted/10 px-3 py-2 text-sm text-foreground">
              <option value="">Selecione...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.legalName} {s.tradeName ? `(${s.tradeName})` : ""}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expectedDate">Previsão de Entrega (Opcional)</Label>
            <Input id="expectedDate" type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="bg-card hover:bg-muted/10 border-input" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ref: Pedido #1234..." className="bg-card hover:bg-muted/10 border-input" />
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-lg font-semibold">Itens do Pedido</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={!supplierId}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Insumo
          </Button>
        </div>

        {!supplierId && <p className="text-sm text-muted-foreground text-center py-4">Selecione um fornecedor para escolher os insumos.</p>}
        {supplierId && items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum insumo adicionado.</p>}
        
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex gap-3 items-end bg-background p-3 rounded-xl border border-border">
              <div className="flex-1 space-y-2">
                <Label className="text-xs">Insumo</Label>
                <select required value={item.supplyItemId} onChange={e => updateItem(index, 'supplyItemId', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background hover:bg-muted/10 px-3 py-1 text-sm text-foreground">
                  <option value="">Selecione...</option>
                  {availableSupplies.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                </select>
              </div>
              <div className="w-24 space-y-2">
                <Label className="text-xs">Qtd</Label>
                <Input type="number" step="0.001" min="0.001" required value={item.quantity === 0 ? "" : item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value))} className="h-9 text-sm" />
              </div>
              <div className="w-24 space-y-2">
                <Label className="text-xs">Unidade</Label>
                <Input required value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="w-32 space-y-2">
                <Label className="text-xs">Custo Un (R$)</Label>
                <Input type="number" step="0.01" min="0" required value={item.unitCost === 0 && !item.supplyItemId ? "" : item.unitCost} onChange={e => updateItem(index, 'unitCost', parseFloat(e.target.value))} className="h-9 text-sm" />
              </div>
              <div className="w-32 space-y-2">
                <Label className="text-xs">Total (R$)</Label>
                <div className="h-9 flex items-center px-3 bg-muted/30 rounded-md border border-input text-sm font-medium">
                  {item.totalCost.toFixed(2)}
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
            <div className="text-lg font-bold">Total do Pedido: <span className="text-primary">R$ {items.reduce((acc, i) => acc + i.totalCost, 0).toFixed(2)}</span></div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit">Salvar Pedido</Button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
