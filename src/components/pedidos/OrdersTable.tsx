"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Eye, 
  MoreHorizontal, 
  Printer, 
  Truck, 
  Settings, 
  CheckCircle2,
  ExternalLink,
  Calendar
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface Order {
  id: string
  code: string | null
  createdAt: Date
  currentStatus: string
  promisedDate: Date | null
  deliveryDate: Date | null
  customer: { fullName: string }
  seller: { name: string } | null
  sale: { id: string, number: string | null, financialStatus: string, totalAmount: number }
}

interface OrdersTableProps {
  orders: Order[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SOLD': 
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Vendido</Badge>
      case 'WAITING_PREPARATION': 
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full text-center">Aguard. Prep.</Badge>
      case 'IN_PRODUCTION': 
        return <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Em Produção</Badge>
      case 'WAITING_DELIVERY': 
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Aguard. Entrega</Badge>
      case 'DELIVERED': 
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Entregue</Badge>
      case 'FINALIZED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Finalizado</Badge>
      case 'CANCELLED': 
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Cancelado</Badge>
      default: 
        return <Badge variant="outline" className="px-3 font-black text-[10px] uppercase tracking-wider rounded-full">{status}</Badge>
    }
  }

  const getFinancialBadge = (status: string) => {
    switch (status) {
      case 'PAID': 
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm">Pago</Badge>
      case 'PENDING': 
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Pendente</Badge>
      case 'PARTIALLY_PAID':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Parcial</Badge>
      case 'OVERDUE':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Atrasado</Badge>
      default: 
        return <Badge variant="outline" className="px-3 font-black text-[10px] uppercase tracking-wider rounded-full">{status}</Badge>
    }
  }

  return (
    <div className="overflow-x-auto no-scrollbar custom-scrollbar">
      <Table className="min-w-[1100px]">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Pedido</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Cliente</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Venda</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Data Criação</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status Operacional</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status Fin.</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Previsão</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Valor Total</TableHead>
            <TableHead className="text-right pr-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-40 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                Nenhum pedido operacional encontrado para os filtros.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow 
                key={order.id} 
                className="hover:bg-slate-50/50 border-slate-50 transition-colors group cursor-pointer h-20" 
                onClick={() => window.location.href = `/vendas-clientes/pedidos/${order.id}`}
              >
                <TableCell className="font-black text-primary pl-8 text-sm">
                  #{order.code || '---'}
                </TableCell>
                <TableCell className="font-black text-primary uppercase tracking-tight text-sm">
                  {order.customer.fullName}
                </TableCell>
                <TableCell>
                    <Link 
                    href={`/vendas-clientes/vendas/${order.sale.id}`} 
                    className="text-blue-600 font-bold uppercase tracking-widest text-[9px] hover:text-blue-700 transition-colors opacity-80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Venda #{order.sale.number}
                  </Link>
                </TableCell>
                <TableCell className="text-slate-400 font-medium text-[10px] uppercase tracking-widest font-sans">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {getStatusBadge(order.currentStatus)}
                </TableCell>
                <TableCell>
                  {getFinancialBadge(order.sale.financialStatus)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px] uppercase tracking-widest font-sans opacity-80">
                    <Calendar className="h-3 w-3 text-slate-300" />
                    {order.promisedDate ? new Date(order.promisedDate).toLocaleDateString('pt-BR') : '---'}
                  </div>
                </TableCell>
                <TableCell className="text-right font-black text-primary font-outfit italic text-lg">
                  {formatCurrency(order.sale.totalAmount)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 p-2 rounded-3xl border-slate-100 shadow-2xl mt-1">
                      <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-2 uppercase tracking-[0.2em]">Gestão Operacional</DropdownMenuLabel>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary" asChild>
                        <Link href={`/vendas-clientes/pedidos/${order.id}`}><Eye className="h-4 w-4" /> Ver Detalhes do Pedido</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                        <Printer className="h-4 w-4" /> Nota de Corte / Preparo
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                        <Settings className="h-4 w-4" /> Iniciar Produção
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                        <Truck className="h-4 w-4" /> Registrar Entrega
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="h-4 w-4" /> Recebido / Liquidado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
