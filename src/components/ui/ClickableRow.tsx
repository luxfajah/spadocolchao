"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface ClickableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  href: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function ClickableRow({ 
  href, 
  children, 
  className, 
  disabled = false,
  ...props 
}: ClickableRowProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    // Evitar navegação se o clique for em botões, links ou menus dentro da linha
    const target = e.target as HTMLElement
    const isInteractive = target.closest('button') || target.closest('a') || target.closest('[role="menuitem"]')
    
    if (isInteractive || disabled) return

    router.push(href)
  }

  return (
    <TableRow
      {...props}
      className={cn(
        !disabled && "cursor-pointer hover:bg-slate-50/50 transition-colors group",
        className
      )}
      onClick={handleClick}
    >
      {children}
    </TableRow>
  )
}
