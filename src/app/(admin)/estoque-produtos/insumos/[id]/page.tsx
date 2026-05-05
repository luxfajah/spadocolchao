import { prisma } from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateInsumo, toggleInsumoStatus, linkSupplierToInsumo, setPrimarySupplier, unlinkSupplier } from "../actions"
import Link from "next/link"
import { ArrowLeft, Check, X, Star, Trash2, Plus } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditInsumoPage({ params }: { params: { id: string } }) {
  const item = await prisma.supplyItem.findUnique({ 
    where: { id: params.id },
    include: {
      supplierSupplyItems: {
        include: { supplier: true },
        orderBy: { isPrimary: 'desc' }
      }
    }
  })
  if (!item) return notFound()

  const categorias = await prisma.supplyCategory.findMany({ where: { isActive: true } })
  const suppliers = await prisma.supplier.findMany({ where: { isActive: true }, orderBy: { legalName: "asc" } })

  const updateAction = updateInsumo.bind(null, item.id)
  const toggleStatusAction = toggleInsumoStatus.bind(null, item.id, item.isActive)
  const linkAction = linkSupplierToInsumo.bind(null, item.id)

  return (
    <div className="space-y-6 max-w-4xl flex flex-col pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque-produtos/suprimentos?tab=insumos"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h2 className="text-2xl font-bold tracking-tight">Cód: {item.code || item.id.substring(0,8)} - {item.name}</h2>
        </div>
        <form action={toggleStatusAction}>
          <Button type="submit" variant={item.isActive ? "destructive" : "default"}>
            {item.isActive ? <><X className="h-4 w-4 mr-2" /> Inativar</> : <><Check className="h-4 w-4 mr-2" /> Ativar</>}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Dados Básicos */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">Dados Básicos</h3>
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="h-12 w-12 object-cover rounded-md border" />
            )}
          </div>
          <form action={updateAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" name="code" defaultValue={item.code || ""} className="bg-card hover:bg-muted/10 border-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de Estoque</Label>
                <Input id="unit" name="unit" defaultValue={item.unit} required className="bg-card hover:bg-muted/10 border-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Insumo</Label>
              <Input id="name" name="name" defaultValue={item.name} required className="bg-card hover:bg-muted/10 border-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <select defaultValue={item.categoryId || ""} id="categoryId" name="categoryId" className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-card hover:bg-muted/10 px-3 py-2 text-sm text-foreground">
                  <option value="">Selecione...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Atualizar Foto do Insumo</Label>
                <Input type="file" id="image" name="image" accept="image/*" className="bg-card hover:bg-muted/10 border-input file:text-foreground file:bg-transparent file:border-0" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Link href="/estoque-produtos/suprimentos?tab=insumos"><Button type="button" variant="outline" className="border-input">Voltar</Button></Link>
              <Button type="submit">Atualizar Dados</Button>
            </div>
          </form>
        </div>

        {/* Fornecedores Vinculados */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Fornecedores Vinculados</h3>
          
          <div className="space-y-3">
            {item.supplierSupplyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum fornecedor vinculado.</p>
            ) : (
              item.supplierSupplyItems.map((link: any) => {
                const setPrimary = setPrimarySupplier.bind(null, item.id, link.id);
                const unlink = unlinkSupplier.bind(null, item.id, link.id);
                
                return (
                  <div key={link.id} className={`flex flex-col gap-2 p-3 rounded-lg border ${link.isPrimary ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {link.isPrimary && <Star className="h-4 w-4 text-primary fill-primary" />}
                        <span className="font-medium text-sm">{link.supplier.legalName}</span>
                      </div>
                      <div className="flex gap-1">
                        {!link.isPrimary && (
                          <form action={setPrimary}>
                            <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Tornar Principal">
                              <Star className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                        {!link.isPrimary && (
                          <form action={unlink}>
                            <Button type="submit" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Remover Vínculo">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-1">
                      <div>UN Compra: <span className="text-foreground">{link.purchaseUnit}</span></div>
                      <div>Custo: <span className="text-foreground">R$ {link.defaultUnitCost.toFixed(2)}</span></div>
                      <div>Prazo: <span className="text-foreground">{link.leadTimeDays}</span> dias</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form action={linkAction} className="mt-6 pt-4 border-t border-border space-y-4 bg-muted/20 p-4 rounded-xl">
            <h4 className="font-medium text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar Fornecedor</h4>
            <div className="space-y-2">
              <Label htmlFor="newSupplierId" className="text-xs">Fornecedor</Label>
              <select required id="newSupplierId" name="newSupplierId" className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background hover:bg-muted/10 px-3 py-1 text-xs text-foreground">
                <option value="">Selecione...</option>
                {suppliers.filter(s => !item.supplierSupplyItems.some((link: any) => link.supplierId === s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.legalName} {s.tradeName ? `(${s.tradeName})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="newPurchaseUnit" className="text-xs">UN Compra</Label>
                <Input id="newPurchaseUnit" name="newPurchaseUnit" required placeholder="Ex: CX" className="h-9 text-xs bg-background border-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDefaultUnitCost" className="text-xs">Custo (R$)</Label>
                <Input id="newDefaultUnitCost" name="newDefaultUnitCost" type="number" step="0.01" required className="h-9 text-xs bg-background border-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLeadTimeDays" className="text-xs">Prazo (Dias)</Label>
                <Input id="newLeadTimeDays" name="newLeadTimeDays" type="number" required defaultValue="0" className="h-9 text-xs bg-background border-input" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" variant="secondary" className="text-xs h-8">Vincular</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
