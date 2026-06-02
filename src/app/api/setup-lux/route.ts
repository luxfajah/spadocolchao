import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("🔍 Buscando usuário Lux Fajah...")

    // 1. Buscar o User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: "lux", mode: "insensitive" } },
          { name: { contains: "Lux", mode: "insensitive" } },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado. Verifique o nome/username." }, { status: 404 })
    }

    // 2. Garantir o JobTitle "Gerente Administrativo" com isPdvSellerRole
    let jobTitle = await prisma.jobTitle.findFirst({
      where: { name: { contains: "Gerente", mode: "insensitive" } },
    })

    if (!jobTitle) {
      jobTitle = await prisma.jobTitle.create({
        data: {
          name: "Gerente Administrativo",
          department: "Administração",
          isPdvSellerRole: true,
          isActive: true,
        },
      })
    } else if (!jobTitle.isPdvSellerRole) {
      jobTitle = await prisma.jobTitle.update({
        where: { id: jobTitle.id },
        data: { isPdvSellerRole: true },
      })
    }

    // 3. Verificar/criar Employee
    let employee = user.employeeId
      ? await prisma.employee.findUnique({ where: { id: user.employeeId } })
      : null

    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { fullName: { contains: "Lux", mode: "insensitive" } },
      })
    }

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          fullName: user.name,
          socialName: user.name,
          email: user.email,
          phone: user.phone ?? null,
          status: "ACTIVE",
          isActive: true,
          contractType: "CLT",
          jobTitleId: jobTitle.id,
        },
      })
    } else {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: { jobTitleId: jobTitle.id, isActive: true, status: "ACTIVE" },
      })
    }

    // 4. Vincular o Employee ao User (se necessário)
    if (user.employeeId !== employee.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId: employee.id },
      })
    }

    // 5. Garantir Seller vinculado ao Employee
    let seller = await prisma.seller.findFirst({
      where: { employeeId: employee.id },
    })

    if (!seller) {
      // Tentar achar por nome antes de criar
      seller = await prisma.seller.findFirst({
        where: { name: { contains: "Lux", mode: "insensitive" }, type: "INTERNAL" },
      })
      if (seller) {
        seller = await prisma.seller.update({
          where: { id: seller.id },
          data: { employeeId: employee.id, isActive: true },
        })
      } else {
        seller = await prisma.seller.create({
          data: {
            name: user.name,
            type: "INTERNAL",
            email: user.email,
            employeeId: employee.id,
            isActive: true,
            defaultCommissionRate: 5.0,
          },
        })
      }
    } else {
      if (!seller.isActive) {
        seller = await prisma.seller.update({ where: { id: seller.id }, data: { isActive: true } })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configuração concluída com sucesso!",
      user: { id: user.id, name: user.name },
      employee: { id: employee.id, name: employee.fullName },
      seller: { id: seller.id, name: seller.name },
      jobTitle: { id: jobTitle.id, name: jobTitle.name, isPdvSellerRole: jobTitle.isPdvSellerRole },
    })
  } catch (error: any) {
    console.error("Erro no setup:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
