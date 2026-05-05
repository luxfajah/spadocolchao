import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seed() {
  console.log("Iniciando injeção de massa de testes...")

  await prisma.productService.createMany({
    data: [
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
        name: "Reforma de Sofá Retrátil (Limpeza e Tecido)",
        code: "SV-REF-001",
        type: "SERVICE",
        operationalCategory: "Limpeza de estofados",
        description: "Serviço completo de higienização e troca do revestimento parcial.",
        unit: "SV",
        defaultPrice: 850.00,
        minimumPrice: 800.00,
        isActive: true,
        highlightInPDV: false,
        managesStock: false,
        useTechnicalSheet: true,
        consumesStock: true
      },
      {
        name: "Tecido Suede Marrom Café",
        code: "INS-TEC-001",
        type: "TECIDO",
        operationalCategory: "Tecido",
        description: "Rolo de tecido suede, largura 1.40m.",
        unit: "M",
        defaultPrice: null, // Insumos não precisam ter preço base para venda
        defaultCost: 25.50,
        currentStock: 150,
        minimumStock: 50,
        isActive: true,
        managesStock: true
      },
      {
        name: "Espuma D33 Soft - Placa 5cm",
        code: "INS-ESP-002",
        type: "ESPUMA",
        operationalCategory: "Espuma",
        unit: "UN",
        defaultCost: 110.00,
        currentStock: 20,
        minimumStock: 10,
        isActive: true,
        managesStock: true
      },
      {
        name: "Box Baú Suede Preto - Queen",
        code: "BOX-BQ-002",
        type: "PRODUCT",
        operationalCategory: "Box novo",
        description: "Cama box com baú, revestimento interno branco.",
        unit: "UN",
        defaultPrice: 1600.00,
        isActive: true,
        highlightInPDV: true,
        managesStock: true,
        currentStock: 0,
        minimumStock: 3
      },
      {
        name: "Produto Antigo Descontinuado",
        code: "OLD-999",
        type: "PRODUCT",
        operationalCategory: "Colchão novo",
        unit: "UN",
        defaultPrice: 500.00,
        isActive: false, // inativo
        managesStock: false
      }
    ]
  })

  console.log("Massa de testes injetada com sucesso! 6 registros adicionados.")
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
