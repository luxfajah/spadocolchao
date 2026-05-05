"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Printer, 
  Copy, 
  XSquare, 
  CreditCard, 
  Package, 
  FileText, 
  History,
  TrendingUp,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface SaleDetailsProps {
  sale: any // TODO: Type properly
}

export function SaleDetails({ sale }: SaleDetailsProps) {
  const [activeTab, setActiveTab] = useState("resumo")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <Badge className="bg-green-100 text-green-700">Confirmada</Badge>
      case 'DRAFT': return <Badge className="bg-blue-100 text-blue-700">Rascunho</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-700">Cancelada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/vendas-clientes/vendas"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-contrast">Venda #{sale.number || '---'}</h1>
              {getStatusBadge(sale.status)}
            </div>
            <p className="text-slate-500 text-sm">Criada em {new Date(sale.createdAt).toLocaleDateString('pt-BR')} às {new Date(sale.createdAt).toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-10">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 h-10">
            <Copy className="h-4 w-4" /> Duplicar
          </Button>
          <Button variant="destructive" className="rounded-xl gap-2 h-10">
            <XSquare className="h-4 w-4" /> Cancelar Venda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-lahomes overflow-hidden">
            <div className="bg-primary p-4 text-white">
              <p className="text-xs uppercase tracking-widest opacity-70 font-bold">Total da Venda</p>
              <p className="text-3xl font-black">{formatCurrency(sale.totalAmount)}</p>
            </div>
            <CardContent className="p-4 space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Cliente</p>
                  <p className="font-semibold text-contrast">{sale.customer.fullName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Vendedor</p>
                  <p className="font-semibold text-contrast">{sale.seller?.name || 'Venda Direta'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Origem</p>
                  <p className="font-semibold text-contrast">{sale.leadSource.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lahomes">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>
                <Badge variant="outline" className={sale.financialStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                  {sale.financialStatus === 'PAID' ? 'Pago' : 'Pendente'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Parcelas</span>
                <span className="text-sm font-bold">{sale.installments?.length || 0}x</span>
              </div>
              <Button variant="outline" className="w-full rounded-xl gap-2 mt-2">
                <CreditCard className="h-4 w-4" /> Ver Parcelas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white border border-brand-900/10 p-1 rounded-2xl h-14 w-full justify-start gap-2 shadow-sm mb-6">
              <TabsTrigger value="resumo" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 gap-2">
                <FileText className="h-4 w-4" /> Resumo
              </TabsTrigger>
              <TabsTrigger value="itens" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 gap-2">
                <Package className="h-4 w-4" /> Itens Vendidos
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 gap-2">
                <CreditCard className="h-4 w-4" /> Financeiro
              </TabsTrigger>
              <TabsTrigger value="pedido" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 gap-2">
                <Package className="h-4 w-4" /> Pedido Vinculado
              </TabsTrigger>
              <TabsTrigger value="comissao" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 gap-2">
                <TrendingUp className="h-4 w-4" /> Comissão
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-6 gap-2">
                <History className="h-4 w-4" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-0">
              <Card className="border-none shadow-lahomes">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-contrast">Resumo da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400 font-bold uppercase">Observações</p>
                      <p className="text-slate-600 bg-slate-50 p-4 rounded-xl italic border border-slate-100 min-h-[100px]">
                        {sale.notes || 'Nenhuma observação registrada.'}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b border-dashed pb-2">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(sale.subtotalAmount)}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed pb-2">
                        <span className="text-slate-500">Desconto</span>
                        <span className="font-semibold text-rose-600">-{formatCurrency(sale.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed pb-2">
                        <span className="text-slate-500">Acréscimos</span>
                        <span className="font-semibold text-blue-600">+{formatCurrency(sale.surchargeAmount)}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-lg font-bold text-contrast">Total Final</span>
                        <span className="text-lg font-black text-primary">{formatCurrency(sale.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="itens" className="mt-0 space-y-4">
              {sale.items.map((item: any) => (
                <Card key={item.id} className="border-none shadow-lahomes">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                            {item.productService?.type || 'PRODUTO'}
                          </Badge>
                          <h3 className="text-lg font-bold text-contrast">{item.description}</h3>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-500">
                          <span>Qtd: <b>{item.quantity}</b></span>
                          <span>Un: <b>{item.unit || 'UN'}</b></span>
                          <span>Preço Unitário: <b>{formatCurrency(item.unitPrice)}</b></span>
                        </div>
                        
                        {/* Detalhes Técnicos Congelados */}
                        {(item.detailMattressReform || item.detailNewMattress) && (
                          <div className="mt-4 p-4 bg-brand-900/5 rounded-xl border border-brand-900/10">
                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Especificações Técnicas</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-slate-400">Tamanho Comercial</p>
                                <p className="font-bold text-contrast">{item.detailMattressReform?.commercialSize || item.detailNewMattress?.commercialSize}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Dimensões Reais</p>
                                <p className="font-bold text-contrast">
                                  {(item.detailMattressReform || item.detailNewMattress).actualWidth}x{(item.detailMattressReform || item.detailNewMattress).actualLength}x{(item.detailMattressReform || item.detailNewMattress).actualHeight}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">Tipo / Densidade</p>
                                <p className="font-bold text-contrast">{(item.detailMattressReform || item.detailNewMattress).mattressType} / {(item.detailMattressReform || item.detailNewMattress).density}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase font-bold">Subtotal Item</p>
                        <p className="text-xl font-black text-contrast">{formatCurrency(item.totalAmount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="financeiro" className="mt-0">
              <Card className="border-none shadow-lahomes">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-contrast">Fluxo de Pagamento</CardTitle>
                    <CardDescription>Parcelamento e vencimentos registrados</CardDescription>
                  </div>
                  <Button className="rounded-xl gap-2 h-10 border-brand-900/10" variant="outline">
                    <CreditCard className="h-4 w-4" /> Registrar Pagamento
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                          <th className="px-4 py-3 text-left">Parcela</th>
                          <th className="px-4 py-3 text-left">Vencimento</th>
                          <th className="px-4 py-3 text-left">Método</th>
                          <th className="px-4 py-3 text-right">Valor</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sale.installments?.map((inst: any) => (
                          <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium">{inst.installmentNumber}ª Parcela</td>
                            <td className="px-4 py-3 text-slate-600">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-slate-600">{inst.paymentMethod.name}</td>
                            <td className="px-4 py-3 text-right font-bold">{formatCurrency(inst.amount)}</td>
                            <td className="px-4 py-3 text-center">
                              {inst.status === 'PAID' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-none">Pago</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 border-none">Pendente</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pedido" className="mt-0">
              {sale.order ? (
                <Card className="border-none shadow-lahomes border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-contrast">Pedido Operacional Execução</CardTitle>
                      <CardDescription>O pedido está sendo processado pela logística/produção</CardDescription>
                    </div>
                    <Button asChild className="rounded-xl gap-2 h-10 bg-blue-600 hover:bg-blue-700">
                      <Link href={`/vendas-clientes/pedidos/${sale.order.id}`}><Package className="h-4 w-4" /> Abrir Pedido</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status Operacional</p>
                      <p className="text-lg font-black text-blue-700">{sale.order.currentStatus}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Previsão de Entrega</p>
                      <p className="text-lg font-black text-contrast">
                        {sale.order.promisedDate ? new Date(sale.order.promisedDate).toLocaleDateString('pt-BR') : 'Não definida'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs text-slate-400 font-bold uppercase mb-1">Cód. Pedido</p>
                      <p className="text-lg font-black text-contrast">#{sale.order.code || '---'}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-brand-900/10 border-dashed border-2 bg-brand-900/5">
                  <CardContent className="p-12 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-brand-900/10 rounded-full flex items-center justify-center text-primary">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-contrast">Nenhum Pedido Vinculado</h3>
                      <p className="text-slate-500 max-w-sm mx-auto mt-2">Esta venda ainda não gerou um pedido operacional para produção ou entrega.</p>
                    </div>
                    <Button className="rounded-xl gap-2 mt-4 bg-primary px-8 h-12 shadow-lahomes">
                      <Package className="h-4 w-4" /> Gerar Pedido Agora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="comissao" className="mt-0">
              <Card className="border-none shadow-lahomes">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-contrast">Comissões Calculadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                          <th className="px-4 py-3 text-left">Vendedor</th>
                          <th className="px-4 py-3 text-left">Regra Aplicada</th>
                          <th className="px-4 py-3 text-right">Base</th>
                          <th className="px-4 py-3 text-center">% ou Fixo</th>
                          <th className="px-4 py-3 text-right">Valor Comissão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sale.commissions?.map((com: any) => (
                          <tr key={com.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-contrast">{com.seller.name}</td>
                            <td className="px-4 py-3 text-slate-600">{com.commissionRule?.name || 'Regra Padrão'}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(com.baseAmount)}</td>
                            <td className="px-4 py-3 text-center">{com.percentage ? `${com.percentage}%` : formatCurrency(com.fixedAmount)}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(com.commissionAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              <Card className="border-none shadow-lahomes">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-contrast">Histórico e Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-contrast text-sm">Venda Criada</p>
                        <p className="text-xs text-slate-500">Por Sistema ERP • {new Date(sale.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    {/* Exemplo de item de histórico */}
                    <div className="relative pl-10 opacity-50">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
                        <History className="h-3 w-3 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-contrast text-sm">Status alterado para CONFIRMADA</p>
                        <p className="text-xs text-slate-500">Por {sale.seller?.name || 'Administrador'} • {new Date(sale.updatedAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
