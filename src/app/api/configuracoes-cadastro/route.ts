import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/app/login/actions'
import { getPdvSellerOptions } from '@/lib/pdv-sellers'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [sellers, leadSources] = await Promise.all([
    getPdvSellerOptions(),
    prisma.leadSource.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ])

  return NextResponse.json({ sellers, leadSources })
}
