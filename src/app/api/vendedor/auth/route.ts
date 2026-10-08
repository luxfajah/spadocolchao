import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Usuário e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const cleanUsername = String(username).trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanUsername },
          { username: cleanUsername },
        ],
      },
      include: {
        primaryRole: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: `Usuário ${user.status.toLowerCase()}. Contate o administrador.` },
        { status: 403 }
      )
    }

    const passwordCheck = verifyPassword(password, user.passwordHash)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: "Credenciais inválidas" },
        { status: 401 }
      )
    }

    // Resolve vendedor vinculado
    const seller = await prisma.seller.findFirst({
      where: {
        isActive: true,
        OR: [
          ...(user.employeeId ? [{ employeeId: user.employeeId }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
    })

    const isUserAdmin = Boolean(
      user.isSuperAdmin ||
      user.primaryRole?.name?.toLowerCase().includes("admin") ||
      user.jobTitle?.toLowerCase().includes("ceo") ||
      user.jobTitle?.toLowerCase().includes("gerente")
    )

    let commissionRate = 0.05
    if (seller?.defaultCommissionRate !== null && seller?.defaultCommissionRate !== undefined) {
      const numRate = Number(seller.defaultCommissionRate)
      commissionRate = numRate >= 1 ? numRate / 100 : numRate
    }

    return NextResponse.json({
      success: true,
      token: user.id, // Token de sessão simplificado para o app
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: isUserAdmin ? "ADMIN" : (user.primaryRole?.name || "VENDEDOR"),
        sellerId: seller?.id || null,
        sellerCode: seller?.code || null,
        commissionRate,
        isAdmin: isUserAdmin,
      },
    })
  } catch (error: any) {
    console.error("Erro no login vendedor API:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
