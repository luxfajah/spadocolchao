import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/app/login/actions'

// GET: busca clientes por nome ou documento
export async function GET(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const url = new URL(req.url)
  const query = url.searchParams.get('q') || ''

  const customers = await prisma.customer.findMany({
    where: {
      isActive: true,
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { document: { contains: query } }
      ]
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      document: true,
      addresses: {
        where: { isMain: true },
        select: {
          zipCode: true,
          street: true,
          number: true,
          neighborhood: true,
          city: true,
          state: true
        }
      }
    },
    take: 15
  })

  return NextResponse.json(customers)
}

// POST: cria um cliente rápido (retorna JSON ao invés de redirect)
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { fullName, phone, whatsapp, document, zipCode, street, number, complement, neighborhood, city, state, sellerId, notes } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const cleanNumeric = (val: string | null | undefined) => val ? val.replace(/\D/g, '') : null

  const customer = await prisma.customer.create({
    data: {
      fullName: fullName.trim(),
      phone: cleanNumeric(phone),
      whatsapp: cleanNumeric(whatsapp || phone),
      document: cleanNumeric(document),
      sellerId: sellerId || null,
      notes: notes || null,
      personType: 'INDIVIDUAL',
      priority: 'NORMAL',
      commercialStatus: 'ACTIVE',
      creditLimit: 0,
      addresses: street ? {
        create: {
          type: 'MAIN',
          zipCode: cleanNumeric(zipCode) || '',
          street: street || '',
          number: number || '',
          complement: complement || '',
          neighborhood: neighborhood || '',
          city: city || '',
          state: state || '',
          isMain: true,
        }
      } : undefined,
    },
  })

  return NextResponse.json({ id: customer.id, fullName: customer.fullName, document: customer.document }, { status: 201 })
}
