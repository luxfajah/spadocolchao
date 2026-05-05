"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { PageHeader } from "@/components/layout/PageHeader"
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Wallet,
  ArrowUpRight,
  ChevronRight,
  Download,
  AlertCircle,
  Settings2,
  TrendingUp,
  Users,
  Check,
  MoreVertical,
  X,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  getCommissionEntries, 
  getCommissionSummary,
  updateCommissionStatus,
  bulkApproveCommissions,
  bulkPayCommissions
} from "./actions"
import { getInitialPdvData } from "../../pdv/actions"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Dynamic import for Recharts to avoid SSR issues
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })

export default function CommissionCentralPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<any[]>([])
  const [summary, setSummary] = useState({ pending: 0, approved: 0, paid: 0, total: 0 })
  const [sellers, setSellers] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Filters
  const [sellerId, setSellerId] = useState("all")
  const [status, setStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const loadData = async () => {
    setLoading(true)
    const filters = {
      sellerId: sellerId === "all" ? null : sellerId,
      status: status === "all" ? null : status
    }
    try {
      const [entriesData, summaryData, pdvData] = await Promise.all([
        getCommissionEntries(filters),
        getCommissionSummary(filters),
        getInitialPdvData()
      ])
      setEntries(entriesData)
      setSummary(summaryData)
      setSellers(pdvData.sellers)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [sellerId, status])

  const filteredEntries = useMemo(() => {
    let result = entries
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(e => 
        e.seller?.name?.toLowerCase().includes(term) ||
        e.sale?.number?.toLowerCase().includes(term) ||
        e.sale?.customer?.fullName?.toLowerCase().includes(term)
      )
    }
    return result
  }, [entries, searchTerm])

  const chartData = useMemo(() => {
    const data: any = {}
    entries.forEach(e => {
      const name = e.seller?.name || "Desconhecido"
      data[name] = (data[name] || 0) + e.commissionAmount
    })
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 5)
  }, [entries])

  const handleApprove = async (id: string) => {
    const result = await updateCommissionStatus(id, "APPROVED")
    if (result.success) {
      toast({ title: "Comissão aprovada!" })
      loadData()
    }
  }

  const handlePay = async (id: string) => {
    const result = await updateCommissionStatus(id, "PAID")
    if (result.success) {
      toast({ title: "Pagamento registrado!" })
      loadData()
    }
  }

  const handleBulkApprove = async () => {
    const result = await bulkApproveCommissions(selectedIds)
    if (result.success) {
      toast({ title: `${selectedIds.length} comissões aprovadas` })
      setSelectedIds([])
      loadData()
    }
  }

  const handleBulkPay = async () => {
    const result = await bulkPayCommissions(selectedIds)
    if (result.success) {
      toast({ title: `${selectedIds.length} pagamentos registrados` })
      setSelectedIds([])
      loadData()
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEntries.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredEntries.map(e => e.id))
    }
  }

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']
    const index = (name || '').length % colors.length
    return colors[index]
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-8 animate-in fade-in duration-700 pb-32">
      <PageHeader 
        title="Central de Comissões"
        subtitle="Monitore, aprove e realize pagamentos de comissões de forma estratégica."
        icon={
           <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600 font-bold" />
           </div>
        }
        actionsWrap
        actions={
          <div className="flex gap-3">
            <Link href="/configuracoes/regras-de-comissao">
              <Button variant="outline" className="rounded-2xl h-11 px-6 gap-2 border-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
                <Settings2 className="h-4 w-4 text-slate-500" /> Regras
              </Button>
            </Link>
            <Button variant="outline" className="rounded-2xl h-11 px-6 gap-2 border-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
              <Download className="h-4 w-4 text-slate-500" /> Exportar
            </Button>
          </div>
        }
      />

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-slate-900 p-8 text-white">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="h-20 w-20" />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Acumulado</span>
            </div>
            <h3 className="text-4xl font-black italic tracking-tighter">R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </Card>

        <Card className="relative overflow-hidden group border-none shadow-xl shadow-amber-100/50 rounded-[2.5rem] bg-amber-50 p-8">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Clock className="h-20 w-20 text-amber-500" />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-200/50 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60">Pendente</span>
            </div>
            <h3 className="text-4xl font-black italic tracking-tighter text-amber-600">R$ {summary.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </Card>

        <Card className="relative overflow-hidden group border-none shadow-xl shadow-indigo-100/50 rounded-[2.5rem] bg-indigo-50 p-8">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <CreditCard className="h-20 w-20 text-indigo-500" />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-200/50 flex items-center justify-center text-indigo-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60">Aprovado</span>
            </div>
            <h3 className="text-4xl font-black italic tracking-tighter text-indigo-600">R$ {summary.approved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </Card>

        <Card className="relative overflow-hidden group border-none shadow-xl shadow-emerald-100/50 rounded-[2.5rem] bg-emerald-50 p-8">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="h-20 w-20 text-emerald-500" />
          </div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-200/50 flex items-center justify-center text-emerald-600">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60">Liquidado</span>
            </div>
            <h3 className="text-4xl font-black italic tracking-tighter text-emerald-600">R$ {summary.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Performance Chart */}
        <div className="xl:col-span-8">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-8 bg-white overflow-hidden h-full min-h-[450px]">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 italic mb-1">Performance da Equipe</h4>
                <p className="text-sm font-bold text-slate-800">Maiores Comissões Geradas</p>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                 <Users className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                      width={120} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Comissão']}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0f172a', '#6366f1', '#10b981', '#f59e0b', '#f43f5e'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">Sem dados para o gráfico</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="xl:col-span-4">
          <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-8 bg-white h-full flex flex-col justify-between space-y-8">
             <div className="space-y-8">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 italic">Filtros Avançados</h4>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pesquisar</Label>
                      <div className="relative group">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                         <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Venda, cliente ou vendedor..." 
                            className="h-12 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold text-xs" 
                         />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Vendedor</Label>
                      <Select value={sellerId} onValueChange={setSellerId}>
                         <SelectTrigger className="rounded-2xl h-12 border-slate-100 bg-slate-50/50 font-bold text-xs">
                            <SelectValue placeholder="Todos" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl">
                            <SelectItem value="all">Todos os Vendedores</SelectItem>
                            {sellers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                         <SelectTrigger className="rounded-2xl h-12 border-slate-100 bg-slate-50/50 font-bold text-xs">
                            <SelectValue placeholder="Todos" />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl">
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="PENDING">Pendentes</SelectItem>
                            <SelectItem value="APPROVED">Aprovadas</SelectItem>
                            <SelectItem value="PAID">Liquidadas</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                </div>
             </div>

             <Button onClick={loadData} className="w-full rounded-2xl h-14 bg-slate-900 hover:bg-black font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.01]">
                Aplicar Filtros
             </Button>
          </Card>
        </div>
      </div>

      {/* Main Table */}
      <Card className="rounded-[3rem] border-slate-100 shadow-xl overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/40">
           <div className="flex items-center gap-4">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800 italic">Extrato Detalhado</h4>
              <Badge variant="outline" className="rounded-xl px-3 py-1 border-slate-200 font-bold text-[10px] text-slate-500 bg-white">{filteredEntries.length} itens</Badge>
           </div>
           {selectedIds.length > 0 && (
             <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{selectedIds.length} selecionados</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500">Limpar</Button>
             </div>
           )}
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full">
              <thead>
                 <tr className="bg-white border-b border-slate-50 text-left">
                    <th className="py-6 px-10 w-12 text-center">
                       <Checkbox 
                         checked={selectedIds.length === filteredEntries.length && filteredEntries.length > 0} 
                         onCheckedChange={toggleSelectAll}
                         className="rounded-md border-slate-200"
                       />
                    </th>
                    <th className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Vendedor</th>
                    <th className="py-6 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Venda #</th>
                    <th className="py-6 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Base</th>
                    <th className="py-6 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Comissão</th>
                    <th className="py-6 px-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="py-6 px-10 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Ações</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    <tr>
                       <td colSpan={7} className="py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando dados...</p>
                          </div>
                       </td>
                    </tr>
                 ) : filteredEntries.length === 0 ? (
                    <tr>
                       <td colSpan={7} className="py-40 text-center">
                          <div className="max-w-xs mx-auto space-y-4">
                             <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto">
                                <AlertCircle className="h-8 w-8 text-slate-200" />
                             </div>
                             <div>
                                <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 italic">Nenhum registro</h5>
                                <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">Ajuste os filtros para ver mais resultados.</p>
                             </div>
                          </div>
                       </td>
                    </tr>
                 ) : filteredEntries.map(entry => (
                    <tr 
                      key={entry.id} 
                      className={`group transition-all duration-300 ${selectedIds.includes(entry.id) ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                    >
                       <td className="py-6 px-10 text-center">
                          <Checkbox 
                            checked={selectedIds.includes(entry.id)} 
                            onCheckedChange={() => toggleSelect(entry.id)}
                            className="rounded-md border-slate-200"
                          />
                       </td>
                       <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                             <div className={`w-11 h-11 rounded-2xl ${getAvatarColor(entry.seller?.name)} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                                {entry.seller?.name?.charAt(0)}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-black text-sm text-slate-800 uppercase italic tracking-tight">{entry.seller?.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(entry.createdAt), "dd MMM yyyy", { locale: ptBR })}</span>
                             </div>
                          </div>
                       </td>
                       <td className="py-6 px-6">
                          <div className="flex flex-col">
                             <span className="font-black text-xs text-indigo-600 uppercase"># {entry.sale?.number || "---"}</span>
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[150px]">{entry.sale?.customer?.fullName}</span>
                          </div>
                       </td>
                       <td className="py-6 px-6 font-bold text-xs text-slate-600">
                          R$ {entry.baseAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                       </td>
                       <td className="py-6 px-6">
                          <div className="flex flex-col">
                             <span className="font-black text-xl text-emerald-600 italic tracking-tighter">R$ {entry.commissionAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="border-none bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5">{entry.percentageApplied}%</Badge>
                                {entry.multiplierApplied !== 1 && <Badge className="bg-amber-500/10 text-amber-500 border-none text-[9px] font-black uppercase px-2 py-0.5">x{entry.multiplierApplied}</Badge>}
                             </div>
                          </div>
                       </td>
                       <td className="py-6 px-6">
                          <Badge className={`rounded-xl px-4 py-1.5 font-black text-[10px] border-none uppercase tracking-widest shadow-sm ${
                            entry.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                            entry.status === 'APPROVED' ? 'bg-indigo-100 text-indigo-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {entry.status === 'PENDING' ? 'Pendente' : entry.status === 'APPROVED' ? 'Aprovado' : 'Pago'}
                          </Badge>
                       </td>
                       <td className="py-6 px-10 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             {entry.status === 'PENDING' && (
                                <Button onClick={() => handleApprove(entry.id)} size="sm" className="rounded-2xl bg-indigo-600 text-white border-none h-11 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
                                   <Check className="h-4 w-4 mr-2" /> Aprovar
                                </Button>
                             )}
                             {entry.status === 'APPROVED' && (
                                <Button onClick={() => handlePay(entry.id)} size="sm" className="rounded-2xl bg-emerald-600 text-white border-none h-11 px-6 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg">
                                   <Wallet className="h-4 w-4 mr-2" /> Pagar
                                </Button>
                             )}
                             <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-slate-300 hover:text-slate-600 hover:bg-slate-100">
                                <MoreVertical className="h-4 w-4" />
                             </Button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </Card>

      {/* Bulk Action Overlay */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
           <Card className="rounded-[2.5rem] bg-slate-900 border-none shadow-2xl p-4 pl-10 flex items-center gap-10 min-w-[650px] text-white">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                    <CheckCircle2 className="h-6 w-6" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lote Financeiro</span>
                    <span className="text-sm font-black italic">{selectedIds.length} selecionados</span>
                 </div>
              </div>

              <div className="flex-1 flex justify-center gap-3">
                 <Button 
                   onClick={handleBulkApprove} 
                   className="rounded-2xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest"
                 >
                    Aprovar Lote
                 </Button>
                 <Button 
                   onClick={handleBulkPay} 
                   className="rounded-2xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-widest"
                 >
                    Pagar Lote
                 </Button>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedIds([])} 
                className="h-12 w-12 rounded-2xl text-slate-500 hover:text-white"
              >
                 <X className="h-5 w-5" />
              </Button>
           </Card>
        </div>
      )}
    </main>
  )
}
