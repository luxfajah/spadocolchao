import { PosLayout } from "./_components/PosLayout"
import { getInitialPdvData } from "./actions"

export default async function PdvPage() {
  const initialData = await getInitialPdvData()

  return (
    <div className="w-full pb-4 lg:-mt-6">
      <PosLayout initialData={initialData} />
    </div>
  )
}
