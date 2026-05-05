"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { 
  User, 
  ShoppingBag, 
  DollarSign, 
  History, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  Briefcase,
  FileText,
  UserCheck,
  Zap,
  Plus,
  ShieldAlert,
  Download
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface ClientCRMViewProps {
  cliente: any
}

export function ClientCRMView({ cliente }: ClientCRMViewProps) {
  const [activeTab, setActiveTab] = useState("geral")

  // Helper formatting
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatDate = (date: Date) => new Date(date).toLocaleDateString("pt-BR")

  // Derived metrics (simplified for UX demo)
  const totalSpent = cliente.sales?.reduce((acc: number, s: any) => acc + s.totalAmount, 0) || 0
  const avgTicket = cliente.sales?.length > 0 ? totalSpent / cliente.sales.length : 0
  const lastSale = cliente.sales?.[0]

  return (
    <div className="space-y-6">
      {/* Header Profile Area */}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="h-24 w-24 rounded-2xl bg-[#002242] text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-primary/20 shrink-0">
          {cliente.fullName.substring(0, 2).toUpperCase()}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold text-contrast tracking-tight">{cliente.fullName}</h1>
            <Badge variant={cliente.isActive ? "default" : "destructive"} className="rounded-full px-4 py-1">
              {cliente.isActive ? "Conta Ativa" : "Inativo"}
            </Badge>
            <Badge variant="outline" className="rounded-full border-[#002242] text-[#002242]">
               {cliente.personType === "INDIVIDUAL" ? "Pessoa Física" : "Pessoa Jurídica"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1"><Mail className="h-4 w-4" /> {cliente.email || "Sem e-mail"}</div>
            <div className="flex items-center gap-1"><Phone className="h-4 w-4" /> {cliente.phone || "Sem telefone"}</div>
            <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {cliente.addresses?.[0]?.city || "Cidade não informada"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
           <Button variant="outline" className="rounded-xl h-12 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest hidden md:flex items-center gap-2">
             <Download className="h-4 w-4" /> Exportar Dossier
           </Button>
           
           <Link href={`/vendas-clientes/clientes/${cliente.id}/editar`}>
             <Button variant="outline" className="rounded-xl h-12 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2">
               <FileText className="h-4 w-4" /> Editar Dados
             </Button>
           </Link>

           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button className="bg-[#002242] hover:bg-slate-900 rounded-xl h-12 px-8 shadow-xl shadow-primary/10 transition-all active:scale-95 font-black text-xs uppercase tracking-[0.15em] flex items-center gap-2">
                 <Zap className="h-4 w-4 text-yellow-400" /> Ações Rápidas
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-64 p-2 rounded-[1.5rem] border-slate-100 shadow-2xl mt-2 font-sans overflow-hidden">
               <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-2 uppercase tracking-[0.2em]">Operações CRM</DropdownMenuLabel>
               <DropdownMenuSeparator className="bg-slate-50" />
               <DropdownMenuItem className="rounded-xl gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 font-bold text-xs text-slate-600 focus:text-primary transition-colors" asChild>
                 <Link href="/vendas-clientes/vendas/new"><Plus className="h-4 w-4" /> Nova Venda (PDV)</Link>
               </DropdownMenuItem>
               <DropdownMenuItem className="rounded-xl gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 font-bold text-xs text-slate-600 focus:text-primary transition-colors">
                 <MessageSquare className="h-4 w-4" /> Adicionar Anotação
               </DropdownMenuItem>
               <DropdownMenuItem className="rounded-xl gap-3 px-4 py-3 cursor-pointer focus:bg-primary/5 font-bold text-xs text-slate-600 focus:text-primary transition-colors">
                 <History className="h-4 w-4" /> Alterar Limite de Crédito
               </DropdownMenuItem>
               <DropdownMenuSeparator className="bg-slate-50" />
               <DropdownMenuItem className="rounded-xl gap-3 px-4 py-3 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-bold text-xs transition-colors">
                 <ShieldAlert className="h-4 w-4" /> Bloquear Faturamento
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="geral" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-14 rounded-2xl border border-border/50 w-full md:w-auto overflow-x-auto no-scrollbar justify-start mb-6">
          <TabsTrigger value="geral" className="rounded-xl h-full px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <User className="h-4 w-4 mr-2" /> Dados Gerais
          </TabsTrigger>
          <TabsTrigger value="vendas" className="rounded-xl h-full px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <ShoppingBag className="h-4 w-4 mr-2" /> Vendas
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="rounded-xl h-full px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <DollarSign className="h-4 w-4 mr-2" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="credito" className="rounded-xl h-full px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <History className="h-4 w-4 mr-2" /> Crédito
          </TabsTrigger>
          <TabsTrigger value="anotacoes" className="rounded-xl h-full px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <MessageSquare className="h-4 w-4 mr-2" /> Anotações
          </TabsTrigger>
        </TabsList>

        {/* --- Tab: Dados Gerais --- */}
        <TabsContent value="geral" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-md flex items-center gap-2 font-bold"><UserCheck className="h-4 w-4 text-blue-600" /> Identificação</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Documento</Label><p className="font-semibold text-contrast">{cliente.document || "-"}</p></div>
                  <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">RG</Label><p className="font-semibold text-contrast">{cliente.rg || "-"}</p></div>
                  <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Nascimento</Label><p className="font-semibold text-contrast">{cliente.birthDate ? formatDate(cliente.birthDate) : "-"}</p></div>
                  <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Gênero</Label><p className="font-semibold text-contrast">{cliente.gender || "-"}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-md flex items-center gap-2 font-bold"><Phone className="h-4 w-4 text-green-600" /> Canais de Contato</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border/50">
                    <span className="text-xs font-bold text-muted-foreground">Celular Principal</span>
                    <span className="text-sm font-bold text-contrast">{cliente.phone || "-"}</span>
                 </div>
                 <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border/50">
                    <span className="text-xs font-bold text-muted-foreground">WhatsApp</span>
                    <span className="text-sm font-bold text-contrast">{cliente.whatsapp || "-"}</span>
                 </div>
                 <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border border-border/50">
                    <span className="text-xs font-bold text-muted-foreground">Instagram</span>
                    <span className="text-sm font-bold text-contrast">{cliente.instagram || "-"}</span>
                 </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-md flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-red-600" /> Endereço Principal</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {cliente.addresses?.[0] ? (
                  <>
                    <p className="text-sm font-bold text-contrast">{cliente.addresses[0].street}, {cliente.addresses[0].number}</p>
                    <p className="text-xs text-muted-foreground">{cliente.addresses[0].neighborhood}</p>
                    <p className="text-xs text-muted-foreground">{cliente.addresses[0].city} - {cliente.addresses[0].state}</p>
                    <p className="text-xs text-muted-foreground font-mono">CEP: {cliente.addresses[0].zipCode}</p>
                  </>
                ) : (
                  <p className="text-sm text-center py-6 text-muted-foreground italic">Nenhum endereço cadastrado</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
               <CardHeader className="pb-3"><CardTitle className="text-md flex items-center gap-2 font-bold"><Briefcase className="h-4 w-4 text-purple-600" /> Dados Profissionais</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Profissão</Label><p className="font-semibold text-contrast">{cliente.profession || "-"}</p></div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Renda Estimada</Label><p className="font-semibold text-contrast">{cliente.income ? formatCurrency(cliente.income) : "-"}</p></div>
                  </div>
               </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50">
               <CardHeader className="pb-3"><CardTitle className="text-md flex items-center gap-2 font-bold"><TrendingUp className="h-4 w-4 text-orange-600" /> Perfil Comercial</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Vendedor</Label><p className="font-semibold text-contrast">{cliente.seller?.name || "-"}</p></div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Prioridade</Label><p className="font-semibold text-contrast">{cliente.priority || "NORMAL"}</p></div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Origem</Label><p className="font-semibold text-contrast">{cliente.leadSource?.name || "-"}</p></div>
                    <div><Label className="text-[10px] uppercase text-muted-foreground font-bold">Cadastrado em</Label><p className="font-semibold text-contrast">{formatDate(cliente.createdAt)}</p></div>
                  </div>
               </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3"><CardTitle className="text-md flex items-center gap-2 font-bold"><FileText className="h-4 w-4 text-slate-600" /> Observações do Cadastro</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {cliente.notes || "Sem observações cadastradas."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Tab: Vendas --- */}
        <TabsContent value="vendas" className="space-y-6 animate-in slide-in-from-right-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Card className="bg-white"><CardContent className="pt-6"><div className="flex flex-col"><span className="text-xs font-bold text-muted-foreground uppercase">Volume de Compras</span><span className="text-2xl font-black text-contrast">{cliente.sales?.length || 0} compras</span></div></CardContent></Card>
             <Card className="bg-white"><CardContent className="pt-6"><div className="flex flex-col"><span className="text-xs font-bold text-muted-foreground uppercase">Valor Total Gasto</span><span className="text-2xl font-black text-contrast">{formatCurrency(totalSpent)}</span></div></CardContent></Card>
             <Card className="bg-white"><CardContent className="pt-6"><div className="flex flex-col"><span className="text-xs font-bold text-muted-foreground uppercase">Ticket Médio</span><span className="text-2xl font-black text-contrast">{formatCurrency(avgTicket)}</span></div></CardContent></Card>
             <Card className="bg-gradient-to-br from-[#002242] to-[#004482] text-white"><CardContent className="pt-6"><div className="flex flex-col"><span className="text-xs font-bold text-white/70 uppercase">Última Compra</span><span className="text-2xl font-black">{lastSale ? formatDate(lastSale.saleDate) : "--/--/----"}</span></div></CardContent></Card>
          </div>

          <Card className="overflow-hidden border-border/50 shadow-md">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
               <div><CardTitle className="text-lg font-bold">Histórico de Pedidos</CardTitle><CardDescription>Lista cronológica de todas as interações comerciais</CardDescription></div>
               <Button className="rounded-xl bg-[#002242]">Nova Venda</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/10">
                  <TableHead className="font-bold">Nº Pedido</TableHead>
                  <TableHead className="font-bold">Data</TableHead>
                  <TableHead className="font-bold">Vendedor</TableHead>
                  <TableHead className="font-bold">Valor</TableHead>
                  <TableHead className="font-bold">Status Venda</TableHead>
                  <TableHead className="font-bold">Status Fin.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cliente.sales?.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-bold text-primary">{s.number || `#${s.id.substring(0,6)}`}</TableCell>
                    <TableCell>{formatDate(s.saleDate)}</TableCell>
                    <TableCell>{cliente.seller?.name || "-"}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(s.totalAmount)}</TableCell>
                    <TableCell>
                       <Badge variant="outline" className="rounded-full px-3">{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="rounded-full px-3">{s.financialStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!cliente.sales?.length && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">Nenhuma compra registrada para este cliente.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* --- Tab: Financeiro --- */}
        <TabsContent value="financeiro" className="space-y-6">
           <Card className="bg-red-50/50 border-red-200"><CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <AlertCircle className="h-10 w-10 text-red-500" />
                 <div><h3 className="font-bold text-red-900">Nenhum débito em atraso identificado</h3><p className="text-red-700/80 text-sm">O cliente está rigorosamente em dia com suas parcelas.</p></div>
              </div>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">Ver Calendário</Button>
           </CardContent></Card>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 shadow-md border-border/50">
                 <CardHeader className="border-b"><CardTitle className="text-lg font-bold">Parcelas e Recebíveis</CardTitle></CardHeader>
                 <Table>
                    <TableHeader><TableRow className="bg-muted/10"><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Pagamento</TableHead><TableHead className="text-right">Recibo</TableHead></TableRow></TableHeader>
                    <TableBody>
                       <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">Módulo de financeiro em fase de carregamento de dados herdados...</TableCell></TableRow>
                    </TableBody>
                 </Table>
              </Card>
              <div className="space-y-6">
                 <Card className="bg-[#002242] text-white shadow-xl shadow-primary/10">
                    <CardHeader className="pb-2"><span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Saldo Total Pago</span></CardHeader>
                    <CardContent><p className="text-4xl font-black">{formatCurrency(totalSpent)}</p></CardContent>
                 </Card>
                 <Card className="border-border/50">
                    <CardHeader className="pb-2"><span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Saldo Em Aberto</span></CardHeader>
                    <CardContent><p className="text-4xl font-black text-contrast">{formatCurrency(0)}</p></CardContent>
                 </Card>
              </div>
           </div>
        </TabsContent>

        {/* --- Tab: Crédito --- */}
        <TabsContent value="credito" className="space-y-6">
           <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-contrast">Análise de Crédito</h3>
                <p className="text-muted-foreground">Controle de limites e histórico de confiança</p>
              </div>
              <Button className="bg-[#002242] h-12 rounded-xl px-6">Solicitar Aumento</Button>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                 <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg">
                    <CardContent className="p-6">
                       <span className="text-[10px] uppercase font-bold text-white/70">Limite Disponível</span>
                       <h4 className="text-3xl font-black">{formatCurrency(cliente.creditLimit || 0)}</h4>
                    </CardContent>
                 </Card>
                 <Card className="p-6 space-y-4">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Score Interno</span><span className="font-bold text-green-600">Excelente</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Atrasado</span><span className="font-bold underline underline-offset-2">R$ 0,00</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Média de Atraso</span><span className="font-bold">0 dias</span></div>
                 </Card>
              </div>
              
              <Card className="lg:col-span-3 border-border/50 shadow-md">
                 <CardHeader><CardTitle className="text-md font-bold">Log de Alterações de Limite</CardTitle></CardHeader>
                 <Table>
                    <TableHeader><TableRow className="bg-muted/10"><TableHead>Data</TableHead><TableHead>Valor Antigo</TableHead><TableHead>Novo Valor</TableHead><TableHead>Motivo</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader>
                    <TableBody>
                       {cliente.creditHistory?.map((h: any) => (
                         <TableRow key={h.id}>
                           <TableCell>{formatDate(h.createdAt)}</TableCell>
                           <TableCell>{formatCurrency(h.previousLimit)}</TableCell>
                           <TableCell>{formatCurrency(h.newLimit)}</TableCell>
                           <TableCell className="max-w-[200px] truncate">{h.reason}</TableCell>
                           <TableCell>{h.changedBy?.name || "-"}</TableCell>
                         </TableRow>
                       ))}
                       {!cliente.creditHistory?.length && (
                          <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhuma alteração registrada.</TableCell></TableRow>
                       )}
                    </TableBody>
                 </Table>
              </Card>
           </div>
        </TabsContent>

        {/* --- Tab: Anotações --- */}
        <TabsContent value="anotacoes" className="space-y-6">
           <div className="flex items-center justify-between">
              <div><h3 className="text-2xl font-bold text-contrast">Notas de Relacionamento</h3><p className="text-muted-foreground">Timeline de ocorrências do cliente</p></div>
              <Button className="bg-[#002242] h-12 rounded-xl px-6">Nova Anotação</Button>
           </div>

           <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {cliente.noteHistory?.map((n: any, idx: number) => (
                <div key={n.id} className="relative flex items-start gap-6 pl-12 group">
                   <div className={`absolute left-0 mt-1 h-10 w-10 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white
                      ${n.noteType === 'COMMERCIAL' ? 'bg-blue-600' : 
                        n.noteType === 'FINANCIAL' ? 'bg-red-600' :
                        n.noteType === 'DELIVERY' ? 'bg-orange-600' : 'bg-slate-500'}`}>
                      <MessageSquare className="h-4 w-4" />
                   </div>
                   <Card className="flex-1 shadow-sm border-border/50 group-hover:border-primary/30 transition-all">
                      <CardContent className="p-4 space-y-2">
                         <div className="flex justify-between items-center">
                            <Badge variant="secondary" className="text-[10px] font-black tracking-widest">{n.noteType}</Badge>
                            <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(n.createdAt)} por {n.createdBy?.name || "Sistema"}</span>
                         </div>
                         <p className="text-sm text-contrast leading-relaxed">{n.content}</p>
                      </CardContent>
                   </Card>
                </div>
              ))}
              {!cliente.noteHistory?.length && (
                 <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                    <p className="text-muted-foreground italic">Inicie a jornada de relacionamento adicionando sua primeira anotação.</p>
                 </div>
              )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
