"use client"

import { useState } from "react"
import { receivePurchaseItem } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ReceiveItemForm({ itemId, remaining, unit }: { itemId: string, remaining: number, unit: string }) {
  const [qty, setQty] = useState(remaining)
  const [loading, setLoading] = useState(false)

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (qty <= 0 || qty > remaining) {
      alert("Quantidade inválida")
      return
    }
    
    setLoading(true)
    try {
      await receivePurchaseItem(itemId, qty)
    } catch (err: any) {
      alert(err.message || "Erro ao receber")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleReceive} className="flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2">
        <Input 
          type="number" 
          step="0.001" 
          max={remaining} 
          min="0.001" 
          required 
          value={qty} 
          onChange={e => setQty(parseFloat(e.target.value))} 
          className="h-8 w-20 text-xs px-2"
          disabled={loading}
        />
        <Button type="submit" size="sm" className="h-8 px-2 text-xs" disabled={loading}>
          {loading ? "..." : "Receber"}
        </Button>
      </div>
      <span className="text-[10px] text-muted-foreground mr-1">Máx: {remaining} {unit}</span>
    </form>
  )
}
