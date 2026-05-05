import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      sale: {
        include: {
          customer: true,
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

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex justify-center print:bg-white print:p-0">
      
      {/* Container Principal */}
      <div className="w-full max-w-[80mm] md:max-w-xl bg-white rounded-xl shadow-lg p-6 md:p-8 print:shadow-none print:w-full print:max-w-none">
        
        {/* Ações não imprimíveis */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <h1 className="text-xl font-bold text-slate-800">Recibo / Pedido</h1>
          <a 
            href="javascript:window.print()" 
            className="flex items-center gap-2 bg-brand-900 text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors text-sm font-semibold"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </a>
        </div>

        {/* Cabecalho do Recibo */}
        <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">SPA DO COLCHÃO</h2>
          <p className="text-xs text-slate-500 mt-1">CNPJ: 00.000.000/0001-00</p>
          <p className="text-xs text-slate-500">Rua Exemplo, 123 - Centro</p>
          
          <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
            <h3 className="font-bold text-lg uppercase tracking-wider">Recibo de Pedido</h3>
            <p className="text-sm font-semibold mt-1">Nº {sale.number || order.id.slice(-6).toUpperCase()}</p>
            <p className="text-xs text-slate-500">{new Date(sale.saleDate).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Informacoes de Cliente e Vendedor */}
        <div className="space-y-1 mb-4 border-b border-dashed border-slate-300 pb-4 text-sm">
          <div className="grid grid-cols-[80px_1fr]">
            <span className="text-slate-500 font-semibold">Cliente:</span>
            <span className="font-bold text-slate-800">{customer.fullName}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr]">
            <span className="text-slate-500 font-semibold">CPF/CNPJ:</span>
            <span className="text-slate-800">{customer.document || 'Não informado'}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr]">
            <span className="text-slate-500 font-semibold">Vendedor:</span>
            <span className="text-slate-800">{seller?.name || 'Sistema'}</span>
          </div>
        </div>

        {/* Itens */}
        <div className="mb-4 text-sm border-b border-dashed border-slate-300 pb-4">
          <div className="font-bold border-b border-slate-200 pb-1 mb-2">ITENS DO PEDIDO</div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="font-normal w-12 pb-1">QTD</th>
                <th className="font-normal pb-1">DESCRIÇÃO</th>
                <th className="font-normal text-right pb-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="align-top border-b border-slate-100 last:border-0">
                  <td className="py-1.5">{item.quantity}x</td>
                  <td className="py-1.5 pr-2">
                    <span className="font-semibold block">{item.description}</span>
                    <span className="text-xs text-slate-500">{formatBRL(item.unitPrice)} cada</span>
                  </td>
                  <td className="py-1.5 text-right font-medium">{formatBRL(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="mb-4 space-y-1 text-sm border-b border-dashed border-slate-300 pb-4">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>{formatBRL(sale.subtotalAmount)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Desconto:</span>
              <span>-{formatBRL(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t border-slate-200">
            <span>TOTAL:</span>
            <span>{formatBRL(sale.totalAmount)}</span>
          </div>
        </div>

        {/* Pagamentos Futuros (Previsão) */}
        <div className="mb-4 text-sm pb-4">
          <div className="font-bold border-b border-slate-200 pb-1 mb-2 text-center bg-slate-50">CONDIÇÃO DE PAGAMENTO</div>
          <p className="text-xs text-center text-slate-500 mb-2 italic">O pagamento ocorrerá na entrega do produto.</p>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500">
                <th className="font-normal pb-1">Forma</th>
                <th className="font-normal pb-1">Parcela</th>
                <th className="font-normal text-right pb-1">Vencimento</th>
                <th className="font-normal text-right pb-1">Valor</th>
              </tr>
            </thead>
            <tbody>
              {installments.map(inst => (
                <tr key={inst.id} className="align-top">
                  <td className="py-1 font-semibold">{inst.paymentMethod.name}</td>
                  <td className="py-1">{inst.installmentNumber}x</td>
                  <td className="py-1 text-right">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="py-1 text-right font-medium">{formatBRL(inst.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-8 pt-4 border-t border-dashed border-slate-300 gap-1 flex flex-col">
          <p className="font-bold">Agradecemos a preferência!</p>
          <p>Documento sem valor fiscal.</p>
        </div>
      </div>
    </div>
  );
}
