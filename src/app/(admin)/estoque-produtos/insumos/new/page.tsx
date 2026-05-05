import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createInsumo } from "../actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function NewInsumoPage() {
  const categorias = await prisma.supplyCategory.findMany({ where: { isActive: true } })
  const suppliers = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { legalName: "asc" } })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/estoque-produtos/suprimentos?tab=insumos"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h2 className="text-2xl font-bold tracking-tight">Novo Insumo</h2>
      </div>

      <form action={createInsumo} className="space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" name="code" className="bg-card hover:bg-muted/10 border-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unidade de Medida</Label>
            <Input id="unit" name="unit" required placeholder="Ex: KG, UN, M" className="bg-card hover:bg-muted/10 border-input" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Insumo</Label>
          <Input id="name" name="name" required className="bg-card hover:bg-muted/10 border-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <select id="categoryId" name="categoryId" className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card hover:bg-muted/10 px-3 py-2 text-sm text-foreground">
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Foto do Insumo (Opcional)</Label>
            <Input type="file" id="image" name="image" accept="image/*" className="bg-card hover:bg-muted/10 border-input file:text-foreground file:bg-transparent file:border-0" />
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <h3 className="mb-4 text-lg font-medium">Fornecedor Principal (Obrigatório)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="supplierId">Fornecedor</Label>
              <select required id="supplierId" name="supplierId" className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card hover:bg-muted/10 px-3 py-2 text-sm text-foreground">
                <option value="">Selecione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.legalName} {s.tradeName ? `(${s.tradeName})` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseUnit">Unidade de Compra</Label>
              <Input id="purchaseUnit" name="purchaseUnit" required placeholder="Ex: CX, Rolo, KG" className="bg-card hover:bg-muted/10 border-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultUnitCost">Custo Padrão (R$)</Label>
              <Input id="defaultUnitCost" name="defaultUnitCost" type="number" step="0.01" required className="bg-card hover:bg-muted/10 border-input" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="leadTimeDays">Prazo de Entrega (Dias)</Label>
              <Input id="leadTimeDays" name="leadTimeDays" type="number" required defaultValue="0" className="bg-card hover:bg-muted/10 border-input" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Link href="/estoque-produtos/suprimentos?tab=insumos"><Button type="button" variant="outline" className="border-input">Cancelar</Button></Link>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </div>
  )
}
