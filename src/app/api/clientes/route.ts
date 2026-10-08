import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/app/login/actions'

// GET: busca clientes por nome, documento ou todos
export async function GET(req: NextRequest) {
  const user = await getUser()
  const url = new URL(req.url)
  const sellerId = url.searchParams.get('sellerId')
  const mobile = url.searchParams.get('mobile')

  if (!user && !sellerId && !mobile) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const query = (url.searchParams.get('q') || '').trim()
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : (query ? 50 : 1000)

  const whereClause: any = { isActive: true }
  if (query) {
    whereClause.OR = [
      { fullName: { contains: query, mode: 'insensitive' } },
      { tradeName: { contains: query, mode: 'insensitive' } },
      { document: { contains: query } },
      { phone: { contains: query } },
      { whatsapp: { contains: query } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      personType: true,
      fullName: true,
      tradeName: true,
      document: true,
      rg: true,
      stateRegistration: true,
      birthDate: true,
      email: true,
      phone: true,
      whatsapp: true,
      notes: true,
      addresses: {
        where: { isMain: true },
        take: 1,
        select: {
          zipCode: true,
          city: true,
          neighborhood: true,
          street: true,
          number: true,
          complement: true,
          state: true,
        },
      },
    },
    orderBy: { fullName: 'asc' },
    take: limit,
  })

  const formatted = customers.map((c) => {
    const addr = c.addresses?.[0]
    return {
      id: c.id,
      personType: c.personType || 'INDIVIDUAL',
      fullName: c.fullName,
      tradeName: c.tradeName || null,
      document: c.document || null,
      rg: c.rg || null,
      birthDate: c.birthDate ? c.birthDate.toISOString() : null,
      email: c.email || null,
      phone: c.phone || null,
      whatsapp: c.whatsapp || null,
      notes: c.notes || null,
      zipCode: addr?.zipCode || null,
      addressStreet: addr?.street || null,
      addressNumber: addr?.number || null,
      addressComplement: addr?.complement || null,
      addressNeighborhood: addr?.neighborhood || null,
      addressCity: addr?.city || null,
      addressState: addr?.state || null,
    }
  })

  return NextResponse.json(formatted)
}

// POST: cria um cliente completo (suporta web e mobile)
export async function POST(req: NextRequest) {
  const user = await getUser()
  const body = await req.json()

  if (!user && !body.sellerId && !body.userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const {
    personType,
    fullName,
    tradeName,
    document,
    stateRegistration,
    rg,
    birthDate,
    gender,
    profession,
    income,
    email,
    phone,
    whatsapp,
    instagram,
    contactPerson,
    notes,
    sellerId,
    leadSourceId,
    creditLimit,
    priority,
    commercialStatus,
    invoiceEmail,
    motherName,
    fatherName,
    companySize,
    zipCode,
    street,
    number,
    complement,
    neighborhood,
    city,
    state
  } = body

  if (!fullName?.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
  }

  const cleanNumeric = (val: string | null | undefined) => val ? val.replace(/\D/g, '') : null

  const customer = await prisma.customer.create({
    data: {
      personType: personType || 'INDIVIDUAL',
      fullName: fullName.trim(),
      tradeName: tradeName || null,
      document: cleanNumeric(document),
      stateRegistration: stateRegistration || null,
      rg: rg ? rg.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
      profession: profession || null,
      income: income ? parseFloat(income) : null,
      email: email || null,
      phone: cleanNumeric(phone),
      whatsapp: cleanNumeric(whatsapp || phone),
      instagram: instagram || null,
      contactPerson: contactPerson || null,
      notes: notes || null,
      sellerId: sellerId || null,
      leadSourceId: leadSourceId || null,
      creditLimit: creditLimit ? parseFloat(creditLimit) : 0,
      priority: priority || 'NORMAL',
      commercialStatus: commercialStatus || 'ACTIVE',
      invoiceEmail: invoiceEmail || null,
      motherName: motherName || null,
      fatherName: fatherName || null,
      companySize: companySize || null,
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
    include: {
      addresses: {
        where: { isMain: true },
        take: 1,
      },
    },
  })

  const addr = customer.addresses?.[0]
  return NextResponse.json({
    success: true,
    id: customer.id,
    fullName: customer.fullName,
    document: customer.document,
    customer: {
      id: customer.id,
      personType: customer.personType,
      fullName: customer.fullName,
      tradeName: customer.tradeName,
      document: customer.document,
      rg: customer.rg,
      birthDate: customer.birthDate ? customer.birthDate.toISOString() : null,
      email: customer.email,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      notes: customer.notes,
      zipCode: addr?.zipCode || null,
      addressStreet: addr?.street || null,
      addressNumber: addr?.number || null,
      addressComplement: addr?.complement || null,
      addressNeighborhood: addr?.neighborhood || null,
      addressCity: addr?.city || null,
      addressState: addr?.state || null,
    }
  }, { status: 201 })
}
