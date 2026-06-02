import { getUser } from "@/app/login/actions"
import { getUserAccessProfile, getUserSellerScopeContext } from "@/lib/access-control"
import { getOrdersDashboardData } from "@/lib/services/orders"
import { OrdersPageClient } from "@/app/(admin)/vendas-clientes/pedidos/OrdersPageClient"

export default async function AppVendedorKanbanPage() {
  const user = await getUser()
  const accessProfile = user ? await getUserAccessProfile(user) : null
  const sellerScope = user && accessProfile ? await getUserSellerScopeContext(user, accessProfile) : null
  const dashboard = await getOrdersDashboardData({
    sellerId: sellerScope?.restrictToOwnPortfolio ? sellerScope.sellerId || "__UNLINKED_SELLER__" : undefined,
  })
  const { orders, summary, ...dashboardSections } = dashboard

  return (
    <div className="w-full h-full">
      <OrdersPageClient
        initialOrders={orders}
        viewMode="kanban-only"
        currentUserRole={accessProfile?.orderFlowRole ?? null}
        kanbanMode={accessProfile?.kanbanMode ?? "view"}
        portfolioNotice={
          sellerScope?.restrictToOwnPortfolio && !sellerScope.sellerLinked
            ? "Seu usuário ainda não está vinculado a um vendedor do PDV. Vincule o colaborador ou o vendedor para filtrar corretamente a carteira."
            : null
        }
        summary={summary}
        dashboard={dashboardSections}
      />
    </div>
  )
}
