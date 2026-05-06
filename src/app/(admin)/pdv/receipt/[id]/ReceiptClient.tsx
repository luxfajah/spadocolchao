"use client";

import { Printer, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";

interface ReceiptClientProps {
  order: any;
}

export function ReceiptClient({ order }: ReceiptClientProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!order || !order.sale) return <div className="p-8 text-center font-bold text-rose-500">Erro: Dados da venda não encontrados.</div>;

  const { sale } = order;
  const { customer, seller, items = [], installments = [] } = sale;
  
  if (!customer) return <div className="p-8 text-center font-bold text-rose-500">Erro: Dados do cliente não encontrados.</div>;

  const addresses = customer.addresses || [];
  const mainAddress = addresses.find((a: any) => a.isMain) || addresses[0];

  const formatBRL = (v: number) => {
    if (typeof v !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  const formatDate = (date: any) => {
    try {
      if (!date) return '---';
      return new Date(date).toLocaleString('pt-BR');
    } catch (e) {
      return '---';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center gap-6 print:bg-white print:p-0">
      
      {/* Estilo para Forçar 80mm na Impressão */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          .print-thermal {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          nav, header, .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-[210mm] flex flex-wrap items-center justify-between gap-4 print:hidden bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-xl shadow-blue-900/5">
        <div className="flex items-center gap-4">
          <Link href="/vendas-clientes/pedidos">
            <Button variant="ghost" className="rounded-full h-12 w-12 p-0 hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-[#02213f] tracking-tight">Recibo de Pedido</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Venda: {sale.number}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/vendas-clientes/pedidos/${order.id}`}>
            <Button 
              variant="outline"
              className="h-12 gap-2 rounded-full border-slate-200 px-6 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-slate-50"
            >
              <Eye className="h-4 w-4" />
              Ver Pedido
            </Button>
          </Link>
          
          <Button 
            onClick={handlePrint} 
            className="h-12 gap-2 rounded-full bg-[#02213f] px-8 text-xs font-black uppercase tracking-[0.15em] text-white shadow-lg shadow-blue-900/20 hover:bg-[#0b3156] hover:scale-105 transition-all"
          >
            <Printer className="h-4 w-4" /> Imprimir 80mm
          </Button>
        </div>
      </div>

      <div 
        ref={receiptRef}
        className="w-full max-w-[80mm] bg-white p-6 shadow-2xl print:shadow-none print:w-full print:p-0 print-thermal"
      >
        <div className="text-center border-b-2 border-slate-100 pb-6 mb-6">
          <h2 className="text-2xl font-black text-[#02213f] tracking-tighter uppercase italic">SPA DO COLCHÃO</h2>
          <div className="mt-1 space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">CNPJ: 00.000.000/0001-00</p>
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">Rua Exemplo, 123 - Centro - SP</p>
          </div>
          
          <div className="mt-6 py-4 border-y-2 border-slate-50 bg-slate-50/50 rounded-xl">
            <h3 className="font-outfit text-sm font-black uppercase italic tracking-tight text-primary">Recibo de Pedido</h3>
            <p className="text-xs font-bold mt-1">Nº {sale.number || order.id.slice(-6).toUpperCase()}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatDate(sale.saleDate)}</p>
          </div>
        </div>

        <div className="mb-6 space-y-3 text-[10px]">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Cliente</p>
            <p className="font-black text-slate-800 uppercase">{customer.fullName}</p>
            <p className="text-slate-500 font-bold">Doc: {customer.document || '---'}</p>
          </div>
          
          <div className="space-y-0.5">
            {customer.phone && <p className="text-slate-600"><span className="font-bold text-slate-400">TEL:</span> {customer.phone}</p>}
            {mainAddress && (
              <p className="text-slate-600 leading-tight">
                <span className="font-bold text-slate-400">END:</span> {mainAddress.street}, {mainAddress.number}
                <br />
                {mainAddress.neighborhood}, {mainAddress.city}/{mainAddress.state}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-3 w-0.5 bg-[#02213f] rounded-full" />
            <span className="font-black uppercase tracking-[0.1em] text-[#02213f] text-[9px]">Itens do Pedido</span>
          </div>
          
          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-2">Qtd</th>
                <th className="py-2">Descrição</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-2 font-bold text-slate-500">{item.quantity}x</td>
                  <td className="py-2 font-bold text-slate-800 pr-2">{item.description}</td>
                  <td className="py-2 text-right font-black text-[#02213f]">{formatBRL(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6 space-y-1.5 border-t-2 border-slate-100 pt-4">
          <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
            <span>Subtotal:</span>
            <span>{formatBRL(sale.subtotalAmount)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-[9px] text-emerald-600 font-bold uppercase">
              <span>Desconto:</span>
              <span>-{formatBRL(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-[#02213f] pt-2">
            <span className="italic">TOTAL:</span>
            <span>{formatBRL(sale.totalAmount)}</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 text-center mb-2 italic border-b border-slate-50 pb-1">
            Pagamento na Entrega
          </p>
          <div className="space-y-2">
            {installments.map((inst: any) => (
              <div key={inst.id} className="flex flex-col gap-0.5 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-slate-700">{inst.installmentNumber}x {inst.paymentMethod.name}</span>
                  <span className="text-[#02213f]">{formatBRL(inst.amount)}</span>
                </div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Venc: {formatDate(inst.dueDate)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-6 border-t-2 border-slate-100">
          <p className="text-[10px] font-black text-[#02213f] uppercase italic">Spa do Colchão</p>
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Recibo sem valor fiscal</p>
        </div>
      </div>
    </div>
  );
}
