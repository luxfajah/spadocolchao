import { createOrigem } from "../actions"
import { OrigemForm } from "../components/OrigemForm"

export default function NewOrigemPage() {
  return (
    <div className="max-w-[1000px] mx-auto py-10 px-6 pb-20">
      <OrigemForm action={createOrigem} />
    </div>
  )
}
