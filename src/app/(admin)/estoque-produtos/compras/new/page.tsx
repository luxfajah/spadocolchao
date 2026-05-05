import { prisma } from "@/lib/prisma"
import { PurchaseForm } from "./PurchaseForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function NewPurchasePage() {
  const suppliers = await prisma.supplier.findMany({ 
    where: { isActive: true }, 
    orderBy: { legalName: "asc" } 
  })
  
  const supplyItems = await prisma.supplyItem.findMany({
    where: { isActive: true },
    include: {
      supplierSupplyItems: true
    },
    orderBy: { name: "asc" }
  })

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex items-center gap-4">
        <Link href="/estoque-produtos/suprimentos?tab=compras">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Nova Compra</h2>
      </div>

      <PurchaseForm suppliers={suppliers} supplyItems={supplyItems} />
    </div>
  )
}
