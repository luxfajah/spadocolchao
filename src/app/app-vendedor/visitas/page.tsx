import { getUser } from "@/app/login/actions"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { VisitasClient } from "./_components/VisitasClient"

export default async function AppVendedorVisitasPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const seller = await prisma.seller.findFirst({
    where: {
      isActive: true,
      OR: [
        ...(user.employeeId ? [{ employeeId: user.employeeId }] : []),
        ...(user.email ? [{ email: user.email }] : []),
      ],
    },
  })

  return <VisitasClient sellerId={seller?.id ?? null} />
}
