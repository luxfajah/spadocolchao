import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [products, paymentMethods, customers, supplyItems, leadSources] = await Promise.all([
      prisma.productService.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          operationalCategory: true,
          defaultPrice: true,
          minimumPrice: true,
          defaultCost: true,
          productionTimeMinutes: true,
          description: true,
          highlightInPDV: true,
        },
        orderBy: [
          { highlightInPDV: "desc" },
          { name: "asc" },
        ],
      }),
      prisma.paymentMethod.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          allowsInstallments: true,
          maxInstallments: true,
        },
      }),
      prisma.customer.findMany({
        take: 50,
        select: {
          id: true,
          fullName: true,
          document: true,
          phone: true,
          whatsapp: true,
          addresses: {
            take: 1,
            select: {
              city: true,
              neighborhood: true,
              street: true,
              number: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.supplyItem.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          currentStock: true,
          unit: true,
          averageCost: true,
          category: {
            select: { name: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.leadSource.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          isDefaultPdv: true,
        },
        orderBy: { priority: "desc" },
      }),
    ])

    // Filtra tecidos e espumas para facilitar a customização no app mobile
    const fabrics = supplyItems.filter(item => 
      item.category?.name?.toLowerCase().includes("tecido") ||
      item.name.toLowerCase().includes("tecido") ||
      item.name.toLowerCase().includes("suede") ||
      item.name.toLowerCase().includes("linho") ||
      item.name.toLowerCase().includes("bouclé") ||
      item.name.toLowerCase().includes("malha")
    )

    const foams = supplyItems.filter(item => 
      item.category?.name?.toLowerCase().includes("espuma") ||
      item.name.toLowerCase().includes("espuma") ||
      item.name.toLowerCase().includes("d28") ||
      item.name.toLowerCase().includes("d33") ||
      item.name.toLowerCase().includes("d45")
    )

    const formattedCustomers = customers.map((c) => {
      const addr = c.addresses?.[0]
      return {
        id: c.id,
        fullName: c.fullName,
        document: c.document,
        phone: c.phone,
        whatsapp: c.whatsapp,
        addressCity: addr?.city || null,
        addressNeighborhood: addr?.neighborhood || null,
        addressStreet: addr?.street || null,
        addressNumber: addr?.number || null,
      }
    })

    return NextResponse.json({
      success: true,
      products,
      paymentMethods,
      customers: formattedCustomers,
      leadSources,
      customization: {
        fabrics,
        foams,
      },
    })
  } catch (error: any) {
    console.error("Erro no init PDV vendedor:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao carregar dados do PDV" },
      { status: 500 }
    )
  }
}
