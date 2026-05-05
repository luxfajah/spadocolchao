import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'BOTH'

  try {
    const [accounts, categories] = await Promise.all([
      prisma.financialAccount.findMany({ where: { status: 'ACTIVE' } }),
      prisma.financialCategory.findMany({ 
        where: { 
          isActive: true,
          type: { in: type === 'BOTH' ? ['ENTRY', 'EXIT', 'BOTH'] : [type, 'BOTH'] }
        } 
      })
    ])

    return NextResponse.json({ accounts, categories })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados auxiliares" }, { status: 500 })
  }
}
