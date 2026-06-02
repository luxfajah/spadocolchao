import { PosLayout } from "@/app/(admin)/pdv/_components/PosLayout"
import { getInitialPdvData } from "@/app/(admin)/pdv/actions"

export default async function AppVendedorPdvPage() {
  const initialData = await getInitialPdvData()

  return (
    <div className="w-full h-full">
      <PosLayout initialData={initialData} />
    </div>
  )
}
