import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { cancelPurchase } from "../actions"
import { ReceiveItemForm } from "./ReceiveItemForm"

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const purchase = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      items: {
        include: { supplyItem: true }
      }
    }
  })

  if (!purchase) return notFound()

  const cancelAction = cancelPurchase.bind(null, purchase.id)

  return (
    <div className="space-y-6 max-w-5xl pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque-produtos/suprimentos?tab=compras">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Pedido {purchase.number}</h2>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold 
            ${purchase.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-600' : 
              purchase.status === 'PARTIAL' ? 'bg-orange-500/10 text-orange-600' : 
              purchase.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' : 
              'bg-zinc-500/10 text-zinc-600'}`}>
            {purchase.status === 'RECEIVED' ? 'Recebido' : 
             purchase.status === 'PARTIAL' ? 'Parcial' : 
             purchase.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
          </span>
        </div>
        {purchase.status !== "CANCELLED" && purchase.status !== "RECEIVED" && (
          <form action={cancelAction}>
            <Button type="submit" variant="destructive" size="sm">
              <XCircle className="h-4 w-4 mr-2" /> Cancelar Pedido
            </Button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Detalhes</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">Fornecedor</span>
                <span className="font-medium">{purchase.supplier.legalName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Data da Compra</span>
                <span>{format(purchase.orderDate, "dd/MM/yyyy HH:mm")}</span>
              </div>
              {purchase.expectedDeliveryDate && (
                <div>
                  <span className="text-muted-foreground block text-xs">Previsão de Entrega</span>
                  <span>{format(purchase.expectedDeliveryDate, "dd/MM/yyyy")}</span>
                </div>
              )}
              {purchase.notes && (
                <div>
                  <span className="text-muted-foreground block text-xs">Observações</span>
                  <span className="block p-2 bg-muted/20 rounded-md mt-1">{purchase.notes}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border mt-2">
                <span className="text-muted-foreground block text-xs">Valor Total</span>
                <span className="text-lg font-bold text-primary">R$ {purchase.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border p-0 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <h3 className="text-lg font-semibold flex items-center gap-2">Itens do Pedido / Recebimento</h3>
              <p className="text-xs text-muted-foreground mt-1">Valide os itens e registre o recebimento para dar entrada no estoque.</p>
            </div>
            
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Insumo</th>
                  <th className="px-4 py-3 font-medium">Qtd Pedida</th>
                  <th className="px-4 py-3 font-medium">Recebido</th>
                  <th className="px-4 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchase.items.map(item => (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{item.supplyItem.name}</div>
                      <div className="text-xs text-muted-foreground">Custo Un: R$ {item.unitCost.toFixed(2)} | Total: R$ {item.totalCost.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium">{item.quantityOrdered}</span> <span className="text-muted-foreground text-xs">{item.unit}</span>
                    </td>
                    <td className="px-4 py-4 content-center">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${item.quantityReceived >= item.quantityOrdered ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, (item.quantityReceived / item.quantityOrdered) * 100)}%` }}></div>
                        </div>
                        <span className="text-xs font-medium min-w-[3ch] text-right">{item.quantityReceived}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {item.quantityReceived < item.quantityOrdered && purchase.status !== "CANCELLED" ? (
                        <ReceiveItemForm 
                          itemId={item.id} 
                          remaining={item.quantityOrdered - item.quantityReceived} 
                          unit={item.unit} 
                        />
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
