import { getUser } from "@/app/login/actions"
import { getUserAccessProfile, getUserSellerScopeContext } from "@/lib/access-control"
import { getSales } from "@/lib/services/sales"
import { prisma } from "@/lib/prisma"

export default async function AppVendedorHistoricoPage() {
  const user = await getUser()
  
  // Resolve the seller linked to the logged in user
  const seller = await prisma.seller.findFirst({
    where: {
      isActive: true,
      OR: [
        ...(user?.employeeId ? [{ employeeId: user.employeeId }] : []),
        ...(user?.email ? [{ email: user.email }] : []),
      ],
    },
  })
  
  const sales = await getSales({
    sellerId: seller ? seller.id : "__NONE__",
  })

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Histórico de Vendas</h1>
      
      <div className="flex flex-col gap-3">
        {sales.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-lg border">
            Nenhuma venda encontrada.
          </div>
        ) : (
          sales.map(sale => (
            <div key={sale.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800">{sale.customer?.fullName || "Cliente não identificado"}</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(sale.saleDate).toLocaleDateString('pt-BR')} às {new Date(sale.saleDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-600 block">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.totalAmount)}
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 inline-block">
                    {sale.status === 'CONFIRMED' ? 'Confirmada' : sale.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
