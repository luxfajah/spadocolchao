import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ClientCRMView } from "./ClientCRMView"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"

export default async function DetailClientePage({ params }: { params: { id: string } }) {
  const cliente = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      addresses: {
        orderBy: { isMain: "desc" }
      },
      contacts: true,
      seller: true,
      leadSource: true,
      noteHistory: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      },
      creditHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      },
      sales: {
        orderBy: { saleDate: "desc" },
        include: {
          installments: true
        }
      }
    }
  })

  if (!cliente) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vendas-clientes/clientes">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted font-bold text-contrast">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Perfil do Cliente</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#002242]">{cliente.fullName}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">ID: {cliente.id.substring(0,8)}</span>
            </div>
          </div>
        </div>
        
      </div>

      <ClientCRMView cliente={cliente} />
    </div>
  )
}
