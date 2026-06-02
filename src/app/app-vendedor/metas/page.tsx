import { getUser } from "@/app/login/actions"
import { getUserAccessProfile, getUserSellerScopeContext } from "@/lib/access-control"
import { prisma } from "@/lib/prisma"

export default async function AppVendedorMetasPage() {
  const user = await getUser()
  const accessProfile = user ? await getUserAccessProfile(user) : null
  const sellerScope = user && accessProfile ? await getUserSellerScopeContext(user, accessProfile) : null
  
  const sellerId = sellerScope?.restrictToOwnPortfolio ? sellerScope.sellerId : undefined

  let goals = []
  if (sellerId) {
    goals = await prisma.sellerGoal.findMany({
      where: { sellerId: sellerId },
      orderBy: { endDate: 'desc' }
    })
  } else {
    goals = await prisma.sellerGoal.findMany({
      orderBy: { endDate: 'desc' },
      take: 10
    })
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-800 mb-4">Minhas Metas</h1>
      
      <div className="flex flex-col gap-4">
        {goals.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-lg border">
            Nenhuma meta cadastrada para você.
          </div>
        ) : (
          goals.map(goal => {
            const progress = (goal.achievedAmount / goal.targetAmount) * 100
            const isCompleted = progress >= 100

            return (
              <div key={goal.id} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      {new Date(goal.startDate).toLocaleDateString('pt-BR', {month:'short', year:'numeric'}).toUpperCase()}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Vencimento: {new Date(goal.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600 block">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.targetAmount)}
                    </span>
                    <span className="text-xs text-slate-500">Objetivo</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Progresso</span>
                    <span className="font-bold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Atingido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.achievedAmount)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
