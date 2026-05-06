import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      sale: {
        include: {
          customer: {
            include: {
              addresses: true
            }
          },
          seller: true,
          items: true,
          installments: {
            include: { paymentMethod: true }
          }
        }
      }
    }
  });

  if (!order) return notFound();

  const { sale } = order;
  const { customer, seller, items, installments } = sale;
  const mainAddress = customer.addresses.find(a => a.isMain) || customer.addresses[0];

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex justify-center print:bg-white print:p-0">
      
      {/* Container Principal */}
      <div className="w-full max-w-[210mm] bg-white rounded-xl shadow-lg p-6 md:p-12 print:shadow-none print:p-8 print:w-full">
        
        {/* Ações não imprimíveis */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <h1 className="text-xl font-bold text-slate-800">Recibo / Pedido</h1>
          <a 
            href="javascript:window.print()" 
            className="flex items-center gap-2 bg-[#02213f] text-white px-6 py-2.5 rounded-full hover:bg-[#0b3156] transition-all text-sm font-bold shadow-lg shadow-blue-900/20"
          >
            <Printer className="h-4 w-4" /> Imprimir Recibo
          </a>
        </div>

        {/* Cabecalho do Recibo */}
        <div className="text-center border-b-2 border-slate-100 pb-8 mb-8">
          <h2 className="text-4xl font-black text-[#02213f] tracking-tighter uppercase italic">SPA DO COLCHÃO</h2>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CNPJ: 00.000.000/0001-00</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rua Exemplo, 123 - Centro - São Paulo/SP</p>
          </div>
          
          <div className="mt-8 py-6 border-y-2 border-slate-50 bg-slate-50/50 rounded-2xl">
            <h3 className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">Recibo de Pedido</h3>
            <div className="mt-2 flex items-center justify-center gap-4">
              <p className="text-sm font-bold bg-white px-3 py-1 rounded-lg border border-slate-200">Nº {sale.number || order.id.slice(-6).toUpperCase()}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(sale.saleDate).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Informacoes de Cliente e Vendedor */}
        <div className="grid md:grid-cols-2 gap-8 mb-8 border-b-2 border-slate-100 pb-8 text-sm">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Dados do Cliente</p>
              <p className="font-black text-xl text-[#02213f]">{customer.fullName}</p>
              <p className="text-slate-600 font-medium">CPF/CNPJ: {customer.document || '---'}</p>
            </div>
            
            <div className="space-y-1">
              {customer.phone && (
                <p className="text-slate-600 flex items-center gap-2">
                  <span className="font-bold text-slate-400">TEL:</span> {customer.phone}
                </p>
              )}
              {customer.email && (
                <p className="text-slate-600 flex items-center gap-2">
                  <span className="font-bold text-slate-400">EMAIL:</span> {customer.email}
                </p>
              )}
              {mainAddress && (
                <p className="text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-400">END:</span> {mainAddress.street}, {mainAddress.number}
                  {mainAddress.complement && ` - ${mainAddress.complement}`}
                  <br />
                  {mainAddress.neighborhood}, {mainAddress.city}/{mainAddress.state} - {mainAddress.zipCode}
                </p>
              )}
            </div>
          </div>

          <div className="md:text-right flex flex-col md:items-end justify-start">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Responsável pela Venda</p>
            <p className="font-black text-lg text-slate-700">{seller?.name || 'Sistema'}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Vendedor Interno</p>
          </div>
        </div>

        {/* Itens */}
        <div className="mb-8 text-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-4 w-1 bg-[#02213f] rounded-full" />
            <span className="font-black uppercase tracking-[0.15em] text-[#02213f] text-xs">Itens do Pedido</span>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3 font-black">Qtd</th>
                  <th className="px-4 py-3 font-black">Descrição do Produto/Serviço</th>
                  <th className="px-4 py-3 font-black text-right">Unitário</th>
                  <th className="px-4 py-3 font-black text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map(item => (
                  <tr key={item.id} className="align-middle hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-500">{item.quantity}x</td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-800 block">{item.description}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-500">{formatBRL(item.unitPrice)}</td>
                    <td className="px-4 py-4 text-right font-black text-[#02213f]">{formatBRL(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totais */}
        <div className="flex flex-col items-end mb-8 border-b-2 border-slate-100 pb-8">
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-sm text-slate-500 font-bold uppercase tracking-wider">
              <span>Subtotal:</span>
              <span>{formatBRL(sale.subtotalAmount)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold uppercase tracking-wider">
                <span>Desconto:</span>
                <span>-{formatBRL(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-black text-[#02213f] pt-4 border-t-2 border-slate-100">
              <span className="italic">TOTAL:</span>
              <span>{formatBRL(sale.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Pagamentos Futuros (Previsão) */}
        <div className="mb-8">
          <div className="flex flex-col items-center gap-2 mb-6 text-center">
            <span className="font-black uppercase tracking-[0.2em] text-slate-400 text-[10px]">Condição de Pagamento</span>
            <p className="text-xs font-bold text-slate-500 italic bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full border border-amber-100">
              O pagamento ocorrerá integralmente na entrega do produto.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {installments.map((inst, idx) => (
              <div key={inst.id} className="p-4 rounded-2xl border-2 border-slate-50 bg-white shadow-sm flex flex-col gap-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Parcela {inst.installmentNumber}</p>
                <p className="font-black text-slate-700">{inst.paymentMethod.name}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</span>
                  <span className="font-black text-primary">{formatBRL(inst.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t-2 border-slate-100">
          <p className="font-outfit text-lg font-black text-[#02213f] uppercase italic tracking-tighter">Agradecemos a preferência!</p>
          <div className="mt-4 flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Documento sem valor fiscal</p>
            <div className="h-1 w-12 bg-slate-100 rounded-full mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
