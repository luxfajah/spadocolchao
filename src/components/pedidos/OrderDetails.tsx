"use client"

import { useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Printer, 
  Truck, 
  Settings, 
  History,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Package,
  FileText,
  CreditCard,
  Phone,
  Clock,
  ExternalLink,
  ClipboardList,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface OrderDetailsProps {
  order: any // TODO: Type properly
}

export function OrderDetails({ order }: OrderDetailsProps) {
  const [activeTab, setActiveTab] = useState("resumo")
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrintSlip = () => {
    const content = printRef.current
    if (!content) return
    
    const win = window.open('', '_blank', 'width=1000,height=800')
    if (!win) {
      alert('Por favor, permita popups para imprimir a ficha.')
      return
    }

    win.document.write(`
      <html>
        <head>
          <title>Ficha de Produção - #${selectedSlip.number}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; margin: 0; }
              .page-break { page-break-after: always; }
            }
            .ficha-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="ficha-container">
            ${content.innerHTML}
          </div>
          <script>
            // Wait for Tailwind to process the content
            setTimeout(() => {
              window.print();
              // window.close(); // Optional: close after printing
            }, 1000);
          </script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SOLD': return <Badge className="bg-blue-100 text-blue-700">Vendido</Badge>
      case 'WAITING_PREPARATION': return <Badge className="bg-amber-100 text-amber-700">Aguard. Prep.</Badge>
      case 'IN_PRODUCTION': return <Badge className="bg-indigo-100 text-indigo-700">Em Produção</Badge>
      case 'WAITING_DELIVERY': return <Badge className="bg-sky-100 text-sky-700">Aguard. Entrega</Badge>
      case 'DELIVERED': return <Badge className="bg-emerald-100 text-emerald-700">Entregue</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-700">Cancelado</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl border border-brand-900/10">
            <Link href="/vendas-clientes/pedidos"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-contrast uppercase italic">Pedido #{order.code || '---'}</h1>
              {getStatusBadge(order.currentStatus)}
            </div>
            <p className="text-slate-500 text-sm">Venda Vinculada: <Link href={`/vendas-clientes/vendas/${order.saleId}`} className="text-blue-600 font-bold hover:underline">#{order.sale.number}</Link></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2 h-10">
            <Printer className="h-4 w-4" /> Imprimir Etiqueta
          </Button>
          <Button className="rounded-xl gap-2 h-10 bg-indigo-600 hover:bg-indigo-700">
            <Settings className="h-4 w-4" /> Mudar Status
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Info - Operational Focus */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-lahomes overflow-hidden">
            <div className="bg-brand-900/5 p-4 border-b border-brand-900/10">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Previsão de Entrega</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="text-xl font-black text-contrast">
                  {order.promisedDate ? new Date(order.promisedDate).toLocaleDateString('pt-BR') : 'A definir'}
                </p>
              </div>
            </div>
            <CardContent className="p-4 space-y-4 pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-1">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Cliente</p>
                  <p className="font-bold text-contrast">{order.customer.fullName}</p>
                  <div className="flex items-center gap-1 text-blue-600 text-xs mt-1">
                    <Phone className="h-3 w-3" /> {order.customer.phone || 'Sem telefone'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 mt-1">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Endereço de Entrega</p>
                  <p className="text-sm text-slate-600 leading-snug">
                    {order.street}, {order.number} <br/>
                    {order.neighborhood} - {order.city}/{order.state}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-dashed">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Responsável Comercial</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-900/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {order.seller?.name?.charAt(0) || 'V'}
                  </div>
                  <p className="text-sm font-medium text-contrast">{order.seller?.name || 'Vendedor'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lahomes bg-primary text-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70 font-bold uppercase">Status Financeiro</span>
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {order.sale.paidAmount >= order.sale.totalAmount ? 'Pago' : (order.sale.paidAmount > 0 ? 'Parcial' : 'Pendente')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-70 font-bold uppercase">Saldo devedor</span>
                <span className="text-xl font-black">{formatCurrency(order.sale.totalAmount - (order.sale.paidAmount || 0))}</span>
              </div>
              {order.sale.paidAmount < order.sale.totalAmount && (
                <p className="text-[10px] text-white/60 font-medium italic">* Pagamento previsto para a entrega</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white border border-brand-900/10 p-1 rounded-2xl h-14 w-full justify-start gap-1 shadow-sm mb-6 overflow-x-auto no-scrollbar">
              <TabsTrigger value="resumo" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-4 gap-2 whitespace-nowrap">
                <FileText className="h-4 w-4" /> Resumo
              </TabsTrigger>
              <TabsTrigger value="itens" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-4 gap-2 whitespace-nowrap">
                <Package className="h-4 w-4" /> Itens e Specs
              </TabsTrigger>
              <TabsTrigger value="producao" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-4 gap-2 whitespace-nowrap">
                <Settings className="h-4 w-4" /> Produção
              </TabsTrigger>
              <TabsTrigger value="entrega" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-4 gap-2 whitespace-nowrap">
                <Truck className="h-4 w-4" /> Entrega
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-4 gap-2 whitespace-nowrap">
                <CreditCard className="h-4 w-4" /> Financeiro
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white h-11 px-4 gap-2 whitespace-nowrap">
                <History className="h-4 w-4" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lahomes">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-contrast uppercase italic">Snapshot do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total</p>
                        <p className="text-lg font-black text-contrast">{formatCurrency(order.sale.totalAmount)}</p>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Status</p>
                        <div className="mt-1">{getStatusBadge(order.currentStatus)}</div>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Local de Entrega</p>
                      <p className="text-sm font-medium text-contrast">
                        {order.street}, {order.number} <br/>
                        {order.neighborhood} — {order.city}/{order.state}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lahomes">
                  <CardHeader>
                    <CardTitle className="text-lg font-black text-contrast uppercase italic">Notas Operacionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-4">
                      <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-900">Observações</p>
                        <p className="text-sm text-amber-800 italic">{order.notes || 'Nenhuma nota especial.'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-lahomes">
                <CardHeader>
                  <CardTitle className="text-lg font-black text-contrast uppercase italic">Itens e Especificações</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {order.sale.items.map((item: any) => (
                      <div key={item.id} className="p-6 flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <h4 className="font-bold text-contrast">{item.description}</h4>
                          </div>
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase text-slate-400 pl-4">
                            <span>Medidas: {item.detailMattressReform?.actualWidth || item.detailNewMattress?.actualWidth || '?'}x{item.detailMattressReform?.actualLength || item.detailNewMattress?.actualLength || '?'}x{item.detailMattressReform?.actualHeight || item.detailNewMattress?.actualHeight || '?'}</span>
                            <span>Densidade: {item.detailMattressReform?.density || item.detailNewMattress?.density || '---'}</span>
                            <span>Tecido: {item.detailMattressReform?.topFabricColor || 'Padrão'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold uppercase">Qtd</p>
                          <p className="text-lg font-black text-primary">{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Criação do Pedido</p>
                  <p className="text-sm font-bold text-contrast">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Última Atualização</p>
                  <p className="text-sm font-bold text-contrast">{new Date(order.updatedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itens" className="mt-0 space-y-4">
              {order.sale.items.map((item: any) => (
                <Card key={item.id} className="border-none shadow-lahomes">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-contrast uppercase italic">{item.description}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase">{item.productService?.type || 'PRODUTO'}</p>
                          </div>
                        </div>

                        {/* Detalhes Técnicos Expandidos para Operacional */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Medidas Reais</p>
                            <p className="font-bold text-contrast">
                              {item.detailMattressReform?.actualWidth || item.detailNewMattress?.actualWidth || '---'} x {item.detailMattressReform?.actualLength || item.detailNewMattress?.actualLength || '---'} x {item.detailMattressReform?.actualHeight || item.detailNewMattress?.actualHeight || '---'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Tecidos</p>
                            <p className="font-bold text-contrast text-xs">
                              T: {item.detailMattressReform?.topFabricColor || 'Padrão'} / L: {item.detailMattressReform?.sideFabricColor || 'Padrão'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Densidade / Tipo</p>
                            <p className="font-bold text-contrast">{item.detailMattressReform?.density || item.detailNewMattress?.density || '---'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:w-32 flex flex-col justify-center items-end border-l border-dashed pl-6">
                         <div className="text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Quantidade</p>
                            <p className="text-3xl font-black text-primary">{item.quantity}</p>
                         </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="producao" className="mt-0 space-y-4">
               <Card className="border-none shadow-lahomes">
                 <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black text-contrast uppercase italic">Fichas de Produção</CardTitle>
                      <CardDescription>Documentos de corte e montagem gerados</CardDescription>
                    </div>
                    <Button className="rounded-xl gap-2 h-10 bg-primary shadow-lg border-brand-900/10 hover:shadow-primary/20 transition-all">
                      <Printer className="h-4 w-4" /> Imprimir Ficha de Preparo
                    </Button>
                 </CardHeader>
                 <CardContent>
                    {order.productionSlips?.length > 0 ? (
                      <div className="space-y-3">
                        {order.productionSlips.map((slip: any) => (
                          <div key={slip.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group cursor-pointer" onClick={() => setSelectedSlip(slip)}>
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                  <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-contrast">#{slip.number}</p>
                                  <p className="text-xs text-slate-400">Gerada em {new Date(slip.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <Badge className="bg-emerald-100 text-emerald-700">{slip.status}</Badge>
                                <Button variant="ghost" size="icon" className="group-hover:text-primary" onClick={(e) => { e.stopPropagation(); setSelectedSlip(slip) }}><Printer className="h-4 w-4" /></Button>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-12 border-2 border-dashed rounded-[2rem] border-brand-900/10">
                        <Clock className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase text-xs">Aguardando geração da ficha técnica operacional</p>
                      </div>
                    )}
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="entrega" className="mt-0">
               <Card className="border-none shadow-lahomes">
                 <CardHeader>
                    <CardTitle className="text-xl font-black text-contrast uppercase italic">Informações Logísticas</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Destinatário e Local</h4>
                          <div className="space-y-3">
                             <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-slate-400" />
                                <p className="text-sm font-bold text-contrast">{order.recipientName || order.customer.fullName}</p>
                             </div>
                             <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <p className="text-sm font-medium text-contrast">{order.recipientPhone || order.customer.phone}</p>
                             </div>
                             <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                                <p className="text-sm text-slate-600">
                                  {order.street}, {order.number} {order.complement && `- ${order.complement}`} <br/>
                                  {order.neighborhood} - {order.city}/{order.state} - {order.zipCode}
                                </p>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Status da Entrega</h4>
                          <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                             {order.deliveredAt ? (
                               <>
                                 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                   <CheckCircle2 className="h-6 w-6" />
                                 </div>
                                 <div>
                                   <p className="text-lg font-black text-contrast">ENTREGUE</p>
                                   <p className="text-xs text-slate-500">Em {new Date(order.deliveredAt).toLocaleString('pt-BR')}</p>
                                 </div>
                               </>
                             ) : (
                               <>
                                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                   <Truck className="h-6 w-6" />
                                 </div>
                                 <div>
                                   <p className="text-lg font-black text-contrast uppercase italic">Aguardando Saída</p>
                                   <p className="text-xs text-slate-500">Agendado para: {order.promisedDate ? new Date(order.promisedDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                                 </div>
                                 <Button className="rounded-xl w-full bg-primary h-11 shadow-md">Lançar Saída</Button>
                               </>
                             )}
                          </div>
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="financeiro" className="mt-0">
               <Card className="border-none shadow-lahomes">
                 <CardHeader>
                    <CardTitle className="text-xl font-black text-contrast uppercase italic">Resumo Financeiro Vinculado</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                       <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                          <p className="text-xl font-black text-contrast">{formatCurrency(order.sale.totalAmount)}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase">Pago</p>
                          <p className="text-xl font-black text-emerald-700">{formatCurrency(order.sale.paidAmount || 0)}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                          <p className="text-[10px] text-amber-600 font-bold uppercase">Pendente</p>
                          <p className="text-xl font-black text-amber-700">{formatCurrency(order.sale.totalAmount - (order.sale.paidAmount || 0))}</p>
                       </div>
                       <div className="flex items-center justify-center">
                          {order.sale.paidAmount >= order.sale.totalAmount ? (
                            <Badge className="bg-emerald-600 text-white text-md px-6 py-2 rounded-xl">TOTALMENTE PAGO</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 text-md px-6 py-2 rounded-xl uppercase font-black italic">Aguardando Pagamento</Badge>
                          )}
                       </div>
                    </div>
                    <Button variant="outline" className="rounded-xl gap-2 w-full h-12 border-brand-900/10 text-primary font-bold shadow-sm" asChild>
                       <Link href={`/vendas-clientes/vendas/${order.saleId}?tab=financeiro`}>Ver fluxo completo de parcelas <ExternalLink className="h-4 w-4"/></Link>
                    </Button>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
               <Card className="border-none shadow-lahomes">
                 <CardHeader>
                    <CardTitle className="text-xl font-black text-contrast uppercase italic">Fluxo Operacional</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                       {order.statusHistory?.map((entry: any, i: number) => (
                          <div key={entry.id} className="relative pl-12 flex items-start gap-4">
                             <div className={`absolute left-0 top-1 w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${i === 0 ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {entry.status === 'DELIVERED' ? <Truck className="h-4 w-4" /> : 
                                 entry.status === 'IN_PRODUCTION' ? <Settings className="h-4 w-4" /> : 
                                 <Package className="h-4 w-4" />}
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1 group hover:bg-white hover:border-primary/20 transition-all">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <p className="font-black text-contrast uppercase text-xs italic">{entry.status}</p>
                                      <p className="text-xs text-slate-500 mt-0.5">{new Date(entry.changedAt).toLocaleString('pt-BR')}</p>
                                   </div>
                                   <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                      <User className="h-3 w-3 text-slate-400" />
                                      <span className="text-[10px] font-bold text-slate-600">{entry.changedBy?.name || 'Sistema'}</span>
                                   </div>
                                </div>
                                {entry.notes && (
                                  <p className="text-sm text-slate-600 mt-2 bg-white/50 p-2 rounded-lg italic">"{entry.notes}"</p>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>

    {/* Modal de Ficha de Produção */}
    {selectedSlip && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedSlip(null)}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-contrast uppercase italic">Ficha de Produção</h2>
              <p className="text-sm text-slate-400">#{selectedSlip.number} · Pedido #{order.code}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handlePrintSlip} className="rounded-xl gap-2 h-10 bg-primary">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedSlip(null)}>
                <span className="text-xl font-bold">✕</span>
              </Button>
            </div>
          </div>
          <div ref={printRef} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Pedido</p>
                <p className="font-black text-contrast">#{order.code}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Ficha Nº</p>
                <p className="font-black text-contrast">#{selectedSlip.number}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cliente</p>
                <p className="font-bold text-contrast">{order.customer.fullName}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Data de Emissão</p>
                <p className="font-bold text-contrast">{new Date(selectedSlip.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] text-amber-700 font-bold uppercase mb-1">Previsão de Entrega</p>
              <p className="text-lg font-black text-amber-900">{order.promisedDate ? new Date(order.promisedDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-2 border-primary pb-4 mb-2">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Configuração Técnica e Serviços</p>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Previsão</p>
                  <p className="text-lg font-black text-primary italic">{order.promisedDate ? new Date(order.promisedDate).toLocaleDateString('pt-BR') : 'A definir'}</p>
                </div>
              </div>

              {selectedSlip.lines?.length > 0 ? selectedSlip.lines.map((line: any) => {
                const item = line.saleItem;
                const config = item?.detailMattressReform || item?.detailBoxReform || item?.detailNewMattress || item?.detailNewBox;
                
                const services = [];
                if (item?.detailMattressReform) {
                  const r = item.detailMattressReform;
                  if (r.optTotalReplacement) services.push("Troca total de espuma");
                  if (r.optFoamStructReinforce) services.push("Reforço estrutural de espuma");
                  if (r.optRegluing) services.push("Recolagem estrutural");
                  if (r.optSpringSystemRepl) services.push("Troca de molejo");
                  if (r.optSpringSystemRepair) services.push("Reparo de molejo");
                  if (r.optFullFabricRepl) services.push("Troca completa de tecido");
                  if (r.optPartialFabricRepl) services.push("Troca parcial de tecido");
                  if (r.optLeveling) services.push("Nivelamento");
                  if (r.optWaterproofing) services.push("Impermeabilização");
                }
                // ... same service logic as before ...
                if (item?.detailBoxReform) {
                  const b = item.detailBoxReform;
                  if (b.optStructureRepair) services.push("Reparo estrutural");
                  if (b.optHardwareReplacement) services.push("Troca de ferragens");
                  if (b.optWaterproofing) services.push("Impermeabilização");
                }
                if (item?.detailNewBox) {
                  const nb = item.detailNewBox;
                  if (nb.optStructureReinforce) services.push("Reforço de estrutura");
                  if (nb.optHardwareReplacement) services.push("Troca de ferragens");
                }

                return (
                  <div key={line.id} className="p-6 rounded-[2rem] border-2 border-slate-200 bg-white space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
                      <div>
                        <h4 className="text-2xl font-black text-contrast uppercase italic leading-none">{item?.description || 'Item'}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">{item?.productService?.name || 'Reforma'}</p>
                      </div>
                      <div className="bg-primary text-white px-6 py-2 rounded-2xl text-center">
                        <p className="text-[10px] font-bold uppercase opacity-80">Quantidade</p>
                        <p className="text-2xl font-black">{line.quantity}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medidas Reais</p>
                        <p className="text-2xl font-black text-contrast whitespace-nowrap">
                          {config?.actualWidth || '?'} x {config?.actualLength || '?'} x {config?.actualHeight || '?'} <span className="text-xs">cm</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tecidos Selecionados</p>
                        <p className="font-black text-contrast text-sm leading-tight">
                          T: {config?.topFabricColor || 'Padrão'} <br/>
                          L: {config?.sideFabricColor || 'Padrão'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Densidade / Tipo</p>
                        <p className="text-xl font-black text-primary">{config?.density || '---'}</p>
                      </div>
                    </div>

                    {services.length > 0 && (
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-primary font-black uppercase mb-3 flex items-center gap-2">
                          <Settings className="h-3 w-3" /> Serviços e Processos de Produção
                        </p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                          {services.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insumos/Material Requirements */}
                    {item?.materialRequirements?.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                           <ClipboardList className="h-3 w-3" /> Lista de Insumos para Separação
                        </p>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] text-slate-400 uppercase font-black">
                                <th className="px-4 py-2 border-b">Parte</th>
                                <th className="px-4 py-2 border-b">Insumo / Material</th>
                                <th className="px-4 py-2 border-b text-right">Qtd Prevista</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {item.materialRequirements.map((req: any) => (
                                <tr key={req.id} className="text-xs text-slate-700 hover:bg-slate-50/50">
                                  <td className="px-4 py-2.5 font-bold italic">{req.part || '---'}</td>
                                  <td className="px-4 py-2.5">{req.supplyItem?.name || '---'}</td>
                                  <td className="px-4 py-2.5 text-right font-black text-contrast">{req.quantityCalculated} <span className="text-[10px] text-slate-400 font-normal">{req.unit}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-400 italic">Nenhum item registrado nesta ficha.</p>
              )}
            </div>
            <div className="pt-4 border-t border-dashed space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Endereço de Entrega</p>
              <p className="text-sm text-slate-600">{order.street}, {order.number} — {order.neighborhood}, {order.city}/{order.state}</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
