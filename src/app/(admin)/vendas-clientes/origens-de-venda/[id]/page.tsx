import { prisma } from "@/lib/prisma"
import { updateOrigem } from "../actions"
import { notFound } from "next/navigation"
import { OrigemForm } from "../components/OrigemForm"

export default async function EditOrigemPage({ params }: { params: { id: string } }) {
  const origem = await prisma.leadSource.findUnique({ 
    where: { id: params.id } 
  })
  
  if (!origem) return notFound()

  const updateAction = updateOrigem.bind(null, origem.id)

  return (
    <div className="max-w-[1000px] mx-auto py-10 px-6 pb-20">
      <OrigemForm 
        initialData={origem} 
        action={updateAction} 
        isEditing={true} 
      />
    </div>
  )
}
