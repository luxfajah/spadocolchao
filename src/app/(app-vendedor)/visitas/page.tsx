import { getUser } from "@/app/login/actions"
import { getUserAccessProfile, getUserSellerScopeContext } from "@/lib/access-control"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function AppVendedorVisitasPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const accessProfile = await getUserAccessProfile(user)
  const sellerScope = await getUserSellerScopeContext(user, accessProfile)
  
  const sellerId = sellerScope?.sellerId

  let visits = []
  if (sellerId) {
    visits = await prisma.sellerVisit.findMany({
      where: { sellerId: sellerId },
      orderBy: { visitDate: 'desc' }
    })
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-slate-800">Minhas Visitas</h1>
        <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full font-medium shadow-sm hover:bg-blue-700">
          + Nova
        </button>
      </div>
      
      {!sellerId && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm border border-yellow-200 mb-4">
          Seu usuário não está vinculado a um vendedor. Você não pode cadastrar visitas avulsas.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {visits.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-lg border">
            Nenhuma visita agendada. Clique em "+ Nova" para adicionar.
          </div>
        ) : (
          visits.map(visit => (
            <div key={visit.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{visit.clientName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    {new Date(visit.visitDate).toLocaleDateString('pt-BR')} às {new Date(visit.visitDate).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                  visit.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  visit.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {visit.status === 'SCHEDULED' ? 'Agendado' : visit.status === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                </span>
              </div>
              
              {visit.clientPhone && (
                <div className="text-sm text-slate-600 mt-2">
                  <strong>Tel:</strong> {visit.clientPhone}
                </div>
              )}
              {visit.clientAddress && (
                <div className="text-sm text-slate-600">
                  <strong>Endereço:</strong> {visit.clientAddress}
                </div>
              )}
              {visit.notes && (
                <div className="text-sm text-slate-500 mt-2 italic border-t pt-2 mt-2">
                  "{visit.notes}"
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
