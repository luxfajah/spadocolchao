import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Iniciando injeção de massa de testes (produtos base)...")

    const products = [
      {
        name: "Colchão Master Ouro - Casal Padrão",
        code: "COM-CP-001",
        type: "PRODUCT",
        operationalCategory: "Colchão novo",
        description: "Colchão premium com molas ensacadas, suporte até 120kg por lado.",
        unit: "UN",
        defaultPrice: 3500.00,
        minimumPrice: 3150.00,
        isActive: true,
        highlightInPDV: true,
        managesStock: true,
        currentStock: 5,
        minimumStock: 2,
        useTechnicalSheet: true,
        consumesStock: false
      },
      {
        name: "Reforma de Colchão (Troca de Tecido e Espuma)",
        code: "SV-REF-002",
        type: "SERVICE",
        operationalCategory: "Reforma de colchão",
        description: "Reforma completa",
        unit: "SV",
        defaultPrice: 1200.00,
        minimumPrice: 1000.00,
        isActive: true,
        highlightInPDV: true,
        managesStock: false,
        useTechnicalSheet: true,
        consumesStock: true
      },
      {
        name: "Reforma de Box (Estrutura e Tecido)",
        code: "SV-REF-003",
        type: "SERVICE",
        operationalCategory: "Reforma de box",
        description: "Reforma de cama box",
        unit: "SV",
        defaultPrice: 600.00,
        minimumPrice: 500.00,
        isActive: true,
        highlightInPDV: true,
        managesStock: false,
        useTechnicalSheet: true,
        consumesStock: true
      },
      {
        name: "Box Novo - Casal Padrão",
        code: "BOX-CP-001",
        type: "PRODUCT",
        operationalCategory: "Box novo",
        description: "Base box reforçada.",
        unit: "UN",
        defaultPrice: 800.00,
        isActive: true,
        highlightInPDV: true,
        managesStock: true,
        currentStock: 10,
        minimumStock: 3
      },
      {
        name: "Limpeza e Impermeabilização de Estofados",
        code: "SV-LIM-001",
        type: "SERVICE",
        operationalCategory: "Limpeza de estofados",
        description: "Serviço de limpeza e impermeabilização",
        unit: "SV",
        defaultPrice: 350.00,
        minimumPrice: 200.00,
        isActive: true,
        highlightInPDV: true,
        managesStock: false,
        useTechnicalSheet: false,
        consumesStock: false
      }
    ]

    let addedCount = 0;

    for (const p of products) {
      // Create if doesn't exist by code
      const exists = await prisma.productService.findUnique({
        where: { code: p.code }
      })

      if (!exists) {
        await prisma.productService.create({ data: p })
        addedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Foram recriados ${addedCount} produtos básicos no catálogo.`,
    })
  } catch (error: any) {
    console.error("Erro ao recriar produtos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
