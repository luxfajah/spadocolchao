import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/app/login/actions'

// GET: lista visitas do vendedor logado ou por sellerId (app mobile)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const querySellerId = searchParams.get("sellerId")

  let sellerId = querySellerId
  if (!sellerId || sellerId === "__NONE__" || sellerId === "null") {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const seller = await prisma.seller.findFirst({
      where: {
        isActive: true,
        OR: [
          ...(user.employeeId ? [{ employeeId: user.employeeId }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
    })
    sellerId = seller?.id || null
  }

  const visits = await prisma.sellerVisit.findMany({
    where: sellerId && sellerId !== "__NONE__" && sellerId !== "null" ? { sellerId } : {},
    orderBy: { visitDate: 'desc' },
  })

  return NextResponse.json(visits)
}

// POST: cria uma nova visita
export async function POST(req: NextRequest) {
  const body = await req.json()
  let { sellerId, clientName, clientPhone, clientAddress, visitDate, notes, customerId } = body

  if (!sellerId || sellerId === "__NONE__" || sellerId === "null") {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const seller = await prisma.seller.findFirst({
      where: {
        isActive: true,
        OR: [
          ...(user.employeeId ? [{ employeeId: user.employeeId }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
    })
    sellerId = seller?.id
  }

  if (!sellerId) return NextResponse.json({ error: 'Vendedor não vinculado' }, { status: 404 })

  if (!clientName || !visitDate) {
    return NextResponse.json({ error: 'Nome do cliente e data são obrigatórios' }, { status: 400 })
  }

  const visit = await prisma.sellerVisit.create({
    data: {
      sellerId,
      customerId: customerId || null,
      clientName,
      clientPhone: clientPhone || null,
      clientAddress: clientAddress || null,
      visitDate: new Date(visitDate),
      notes: notes || null,
      status: 'SCHEDULED',
    },
  })

  return NextResponse.json(visit, { status: 201 })
}

// PATCH: atualizar status da visita
export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { visitId, status, notes } = body

  if (!visitId || !status) {
    return NextResponse.json({ error: 'ID e status são obrigatórios' }, { status: 400 })
  }

  if (!['SCHEDULED', 'COMPLETED', 'LOST', 'CANCELLED'].includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const visit = await prisma.sellerVisit.update({
    where: { id: visitId },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json(visit)
}
