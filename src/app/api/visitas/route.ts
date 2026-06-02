import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/app/login/actions'

// GET: lista visitas do vendedor logado
export async function GET() {
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

  if (!seller) return NextResponse.json({ error: 'Vendedor não vinculado' }, { status: 404 })

  const visits = await prisma.sellerVisit.findMany({
    where: { sellerId: seller.id },
    orderBy: { visitDate: 'desc' },
  })

  return NextResponse.json(visits)
}

// POST: cria uma nova visita
export async function POST(req: NextRequest) {
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

  if (!seller) return NextResponse.json({ error: 'Vendedor não vinculado' }, { status: 404 })

  const body = await req.json()
  const { clientName, clientPhone, clientAddress, visitDate, notes } = body

  if (!clientName || !visitDate) {
    return NextResponse.json({ error: 'Nome do cliente e data são obrigatórios' }, { status: 400 })
  }

  const visit = await prisma.sellerVisit.create({
    data: {
      sellerId: seller.id,
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
