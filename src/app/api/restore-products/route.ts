import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Buscando produtos inativos (apagados)...")

    const inactiveProducts = await prisma.productService.findMany({
      where: { isActive: false },
    })

    if (inactiveProducts.length === 0) {
      return NextResponse.json({ message: "Nenhum produto inativo encontrado." })
    }

    const restoredProducts = []

    for (const product of inactiveProducts) {
      await prisma.productService.update({
        where: { id: product.id },
        data: { isActive: true },
      })
      restoredProducts.push(product.name)
    }

    return NextResponse.json({
      success: true,
      message: `Foram restaurados ${inactiveProducts.length} produtos.`,
      restoredProducts,
    })
  } catch (error: any) {
    console.error("Erro ao restaurar produtos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
