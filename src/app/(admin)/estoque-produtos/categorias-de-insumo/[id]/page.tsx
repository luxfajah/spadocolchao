import { prisma } from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { updateCategoriaInsumo, toggleCategoriaInsumoStatus } from "../actions"
import Link from "next/link"
import { ArrowLeft, Check, X } from "lucide-react"
import { notFound } from "next/navigation"

export default async function EditCategoriaInsumoPage({ params }: { params: { id: string } }) {
  const category = await prisma.supplyCategory.findUnique({ where: { id: params.id } })
  if (!category) return notFound()

  const updateAction = updateCategoriaInsumo.bind(null, category.id)
  const toggleStatusAction = toggleCategoriaInsumoStatus.bind(null, category.id, category.isActive)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/estoque-produtos/central-de-insumos?tab=categorias"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h2 className="text-2xl font-bold tracking-tight">Editar Categoria de Insumo</h2>
        </div>
        <form action={toggleStatusAction}>
          <Button type="submit" variant={category.isActive ? "destructive" : "default"}>
            {category.isActive ? <><X className="h-4 w-4 mr-2" /> Inativar</> : <><Check className="h-4 w-4 mr-2" /> Ativar</>}
          </Button>
        </form>
      </div>

      <form action={updateAction} className="space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Categoria</Label>
          <Input id="name" name="name" defaultValue={category.name} required className="bg-card hover:bg-muted/10 border-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" defaultValue={category.description || ""} className="bg-card hover:bg-muted/10 border-input" />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Link href="/estoque-produtos/central-de-insumos?tab=categorias"><Button type="button" variant="outline" className="border-input">Cancelar</Button></Link>
          <Button type="submit">Atualizar</Button>
        </div>
      </form>
    </div>
  )
}
