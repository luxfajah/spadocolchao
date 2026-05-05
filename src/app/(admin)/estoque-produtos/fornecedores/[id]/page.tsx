import { prisma } from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateSupplier, toggleSupplierStatus } from "../actions"
import Link from "next/link"
import { ArrowLeft, Save, Check, X, Box, ShoppingCart } from "lucide-react"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      supplierSupplyItems: {
        include: { supplyItem: { include: { category: true } } }
      },
      purchaseOrders: {
        orderBy: { orderDate: 'desc' }
      }
    }
  })

  if (!supplier) return notFound()

  const toggleStatusAction = toggleSupplierStatus.bind(null, supplier.id, supplier.isActive)
  const updateAction = updateSupplier.bind(null, supplier.id)

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque-produtos/suprimentos?tab=fornecedores">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">{supplier.legalName}</h2>
          {!supplier.isActive && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Inativo</span>
          )}
        </div>
        <div className="flex items-center gap-2">
           <form action={toggleStatusAction}>
             <Button type="submit" variant={supplier.isActive ? "destructive" : "default"}>
                {supplier.isActive ? <><X className="h-4 w-4 mr-2" /> Desativar Fornecedor</> : <><Check className="h-4 w-4 mr-2" /> Reativar Fornecedor</>}
             </Button>
           </form>
        </div>
      </div>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dados" className="px-6">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="insumos" className="px-6">
            Insumos Fornecidos 
            <span className="ml-2 bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5 text-xs">{supplier.supplierSupplyItems.length}</span>
          </TabsTrigger>
          <TabsTrigger value="compras" className="px-6">
            Compras
            <span className="ml-2 bg-slate-200 dark:bg-slate-700 rounded-full px-2 py-0.5 text-xs">{supplier.purchaseOrders.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <form action={updateAction} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-border pb-2">Empresa</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="personType">Tipo de Pessoa</Label>
                      <select id="personType" name="personType" defaultValue={supplier.personType} className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground">
                        <option value="JURIDICA">Pessoa Jurídica (CNPJ)</option>
                        <option value="FISICA">Pessoa Física (CPF)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document">CNPJ / CPF</Label>
                      <Input id="document" name="document" defaultValue={supplier.document || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Razão Social / Nome <span className="text-red-500">*</span></Label>
                    <Input id="legalName" name="legalName" defaultValue={supplier.legalName} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tradeName">Nome Fantasia</Label>
                    <Input id="tradeName" name="tradeName" defaultValue={supplier.tradeName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                    <Input id="stateRegistration" name="stateRegistration" defaultValue={supplier.stateRegistration || ""} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b border-border pb-2">Contato</h3>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Pessoa de Contato</Label>
                    <Input id="contactPerson" name="contactPerson" defaultValue={supplier.contactPerson || ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" name="email" type="email" defaultValue={supplier.email || ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input id="phone" name="phone" defaultValue={supplier.phone || ""} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" name="whatsapp" defaultValue={supplier.whatsapp || ""} />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="font-semibold text-lg border-b border-border pb-2">Endereço</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input id="zipCode" name="zipCode" defaultValue={supplier.zipCode || ""} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Logradouro / Rua</Label>
                    <Input id="street" name="street" defaultValue={supplier.street || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" name="number" defaultValue={supplier.number || ""} />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" name="complement" defaultValue={supplier.complement || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" name="neighborhood" defaultValue={supplier.neighborhood || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" defaultValue={supplier.city || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado (UF)</Label>
                    <Input id="state" name="state" defaultValue={supplier.state || ""} placeholder="SP" maxLength={2} className="uppercase" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={supplier.notes || ""}
                  className="flex w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/10"
                ></textarea>
              </div>

              <div className="flex justify-end pt-4 gap-2">
                <Link href="/estoque-produtos/suprimentos?tab=fornecedores">
                  <Button type="button" variant="outline" className="border-input">Voltar</Button>
                </Link>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="mr-2 h-4 w-4" /> Atualizar Fornecedor
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="insumos">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Box className="h-5 w-5 text-blue-500" /> Insumos Associados ao Fornecedor</h3>
            
            <table className="w-full text-sm text-left border mt-4">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Insumo</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium text-center">Referência</th>
                    <th className="px-4 py-3 font-medium text-center">Un. Compra</th>
                    <th className="px-4 py-3 font-medium text-center">Custo Ref.</th>
                    <th className="px-4 py-3 font-medium text-center">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplier.supplierSupplyItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Nenhum insumo vinculado a este fornecedor.</td>
                    </tr>
                  ) : (
                    supplier.supplierSupplyItems.map((link: any) => (
                      <tr key={link.id} className="hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <Link href={`/estoque-produtos/insumos/${link.supplyItemId}`} className="font-semibold text-blue-600 hover:underline">
                            {link.supplyItem.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4">{link.supplyItem.category?.name || '-'}</td>
                        <td className="px-4 py-4 text-center">
                          {link.isPrimary ? <span className="bg-blue-100 text-blue-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Principal</span>
                           : <span className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Alternativo</span>}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-muted-foreground">{link.purchaseUnit}</td>
                        <td className="px-4 py-4 text-center font-semibold text-slate-700 dark:text-slate-200">R$ {link.defaultUnitCost.toFixed(2)}</td>
                        <td className="px-4 py-4 text-center">{link.leadTimeDays} dias</td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="compras">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-emerald-500" /> Histórico de Pedidos de Compra</h3>
            
            <table className="w-full text-sm text-left border mt-4">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pedido</th>
                    <th className="px-4 py-3 font-medium">Data Emissão</th>
                    <th className="px-4 py-3 font-medium">Previsão Entrega</th>
                    <th className="px-4 py-3 font-medium">Valor Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplier.purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhuma compra feita com este fornecedor.</td>
                    </tr>
                  ) : (
                    supplier.purchaseOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-muted/30">
                        <td className="px-4 py-4">
                          <Link href={`/estoque-produtos/compras/${order.id}`} className="font-mono font-bold text-blue-600 hover:underline">
                            {order.number || order.id.substring(0,8)}
                          </Link>
                        </td>
                        <td className="px-4 py-4">{format(order.orderDate, "dd/MM/yyyy")}</td>
                        <td className="px-4 py-4">{order.expectedDeliveryDate ? format(order.expectedDeliveryDate, "dd/MM/yyyy") : "-"}</td>
                        <td className="px-4 py-4 font-semibold text-emerald-600">R$ {order.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold uppercase">{order.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
