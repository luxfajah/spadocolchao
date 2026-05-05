import { getOrderById } from "@/lib/services/orders"
import { OrderDetails } from "@/components/pedidos/OrderDetails"
import { notFound } from "next/navigation"

interface PedidoDetalhePageProps {
  params: { id: string }
}

export default async function PedidoDetalhePage({ params }: PedidoDetalhePageProps) {
  const order = await getOrderById(params.id)

  if (!order) {
    notFound()
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1600px] mx-auto">
      <OrderDetails order={order} />
    </main>
  )
}
