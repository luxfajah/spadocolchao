"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createCategoriaInsumo } from "../actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewCategoriaInsumoPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/estoque-produtos/central-de-insumos?tab=categorias"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h2 className="text-2xl font-bold tracking-tight">Nova Categoria de Insumo</h2>
      </div>

      <form action={createCategoriaInsumo} className="space-y-6 bg-card border border-border p-8 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Categoria</Label>
          <Input id="name" name="name" required className="bg-card hover:bg-muted/10 border-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" className="bg-card hover:bg-muted/10 border-input" />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Link href="/estoque-produtos/central-de-insumos?tab=categorias"><Button type="button" variant="outline" className="border-input">Cancelar</Button></Link>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </div>
  )
}
