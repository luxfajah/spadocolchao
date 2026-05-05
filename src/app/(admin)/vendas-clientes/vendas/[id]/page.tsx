import { getSaleById } from "@/lib/services/sales"
import { SaleDetails } from "@/components/vendas/SaleDetails"
import { notFound } from "next/navigation"

interface VendaDetalhePageProps {
  params: { id: string }
}

export default async function VendaDetalhePage({ params }: VendaDetalhePageProps) {
  const sale = await getSaleById(params.id)

  if (!sale) {
    notFound()
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1600px] mx-auto">
      <SaleDetails sale={sale} />
    </main>
  )
}
