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
  Copy, 
  XCircle, 
  ExternalLink,
  ChevronRight
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

interface Sale {
  id: string
  number: string | null
  saleDate: Date
  customer: { fullName: string }
  seller: { name: string } | null
  leadSource: { name: string }
  totalAmount: number
  status: string
  financialStatus: string
  _count: { items: number }
  order: { id: string, code: string | null } | null
}

interface SalesTableProps {
  sales: Sale[]
}

export function SalesTable({ sales }: SalesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Confirmada</Badge>
      case 'DRAFT':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Rascunho</Badge>
      case 'CANCELLED':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Cancelada</Badge>
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
        return <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full">Parcial</Badge>
      case 'OVERDUE':
        return <Badge className="bg-rose-500 text-white hover:bg-rose-500 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm">Atrasado</Badge>
      default:
        return <Badge variant="outline" className="px-3 font-black text-[10px] uppercase tracking-wider rounded-full">{status}</Badge>
    }
  }

  return (
    <div className="overflow-x-auto no-scrollbar custom-scrollbar">
      <Table className="min-w-[1100px]">
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Número</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Data</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Cliente</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Vendedor</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Itens</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Valor Total</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Financeiro</TableHead>
            <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Pedido</TableHead>
            <TableHead className="text-right pr-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                Nenhuma venda encontrada para os filtros aplicados.
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <TableRow 
                key={sale.id} 
                className="hover:bg-slate-50/50 border-slate-50 transition-colors group cursor-pointer h-20" 
                onClick={() => window.location.href = `/vendas-clientes/vendas/${sale.id}`}
              >
                <TableCell className="font-black text-primary pl-8 text-sm">
                  #{sale.number || '---'}
                </TableCell>
                <TableCell className="text-slate-400 font-medium text-[10px] uppercase tracking-widest font-sans">
                  {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="font-black text-primary uppercase tracking-tight text-sm">
                  {sale.customer.fullName}
                </TableCell>
                <TableCell className="text-slate-500 font-medium text-xs uppercase tracking-tight opacity-80">
                  {sale.seller?.name || '---'}
                </TableCell>
                <TableCell className="text-right text-slate-400 font-medium text-sm italic">
                  {sale._count.items}
                </TableCell>
                <TableCell className="text-right font-black text-primary font-outfit italic text-lg">
                  {formatCurrency(sale.totalAmount)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(sale.status)}
                </TableCell>
                <TableCell>
                  {getFinancialBadge(sale.financialStatus)}
                </TableCell>
                <TableCell>
                  {sale.order ? (
                    <Link 
                      href={`/vendas-clientes/pedidos/${sale.order.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-black uppercase tracking-widest hover:text-blue-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{sale.order.code || 'Ver'} <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-slate-400 text-[10px] font-bold uppercase italic tracking-widest opacity-50">Sem pedido</span>
                  )}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-3xl border-slate-100 shadow-2xl mt-1">
                      <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-2 uppercase tracking-[0.2em]">Ações da Venda</DropdownMenuLabel>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary" asChild>
                        <Link href={`/vendas-clientes/vendas/${sale.id}`}><Eye className="h-4 w-4" /> Visualizar Detalhes</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                        <Printer className="h-4 w-4" /> Imprimir Comprovante
                      </DropdownMenuItem>
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                        <Copy className="h-4 w-4" /> Duplicar Venda
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                      <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-bold text-xs">
                        <XCircle className="h-4 w-4" /> Cancelar Lançamento
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

