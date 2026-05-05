import { getUser } from "@/app/login/actions"
import { getOrdersViewMode, getUserAccessProfile, getUserSellerScopeContext } from "@/lib/access-control"
import { getOrdersDashboardData } from "@/lib/services/orders"
import { OrdersPageClient } from "./OrdersPageClient"

export default async function PedidosPage() {
  const user = await getUser()
  const accessProfile = user ? await getUserAccessProfile(user) : null
  const sellerScope = user && accessProfile ? await getUserSellerScopeContext(user, accessProfile) : null
  const sellerIdFilter =
    sellerScope?.restrictToOwnPortfolio
      ? sellerScope.sellerId || "__UNLINKED_SELLER__"
      : undefined
  const dashboard = await getOrdersDashboardData({
    sellerId: sellerIdFilter,
  })
  const { orders, summary, ...dashboardSections } = dashboard

  return (
    <main className="flex-1 py-10 px-6 max-w-[1600px] mx-auto">
      <OrdersPageClient
        initialOrders={orders}
        viewMode={accessProfile ? getOrdersViewMode(accessProfile) : "full"}
        currentUserRole={accessProfile?.orderFlowRole ?? null}
        kanbanMode={accessProfile?.kanbanMode ?? "view"}
        portfolioNotice={
          sellerScope?.restrictToOwnPortfolio && !sellerScope.sellerLinked
            ? "Seu usuário ainda não está vinculado a um vendedor do PDV. Vincule o colaborador ou o vendedor para exibir apenas sua carteira."
            : null
        }
        summary={summary}
        dashboard={dashboardSections}
      />
    </main>
  )
}
