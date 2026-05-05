import { prisma } from "@/lib/prisma"
import { ClientForm } from "./ClientForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getPdvSellerOptions } from "@/lib/pdv-sellers"

export default async function NewClientePage() {
  const sellers = await getPdvSellerOptions()

  const leadSources = await prisma.leadSource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendas-clientes/clientes">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-contrast">Adicionar Cliente</h2>
          <p className="text-muted-foreground">Registre novos clientes para vendas e relacionamento comercial</p>
        </div>
      </div>

      <ClientForm sellers={sellers} leadSources={leadSources} />
    </div>
  )
}
