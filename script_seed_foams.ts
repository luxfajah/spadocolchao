import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando carga de espumas no banco...')

  // Get or Create Supplier
  let supplier = await prisma.supplier.findFirst({
    where: { tradeName: 'Fornecedora de Espumas Ltda' }
  })

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        tradeName: 'Fornecedora de Espumas Ltda',
        legalName: 'Fornecedora de Espumas Ltda',
        document: '99.999.999/0001-99',
        personType: 'JURIDICA',
        isActive: true
      }
    })
    console.log('Fornecedor de espumas criado.')
  }

  // Get or Create Category
  let category = await prisma.supplyCategory.findFirst({
    where: { name: 'Espumas e Estofamentos' }
  })

  if (!category) {
    category = await prisma.supplyCategory.create({
      data: { name: 'Espumas e Estofamentos' }
    })
    console.log('Categoria Espumas e Estofamentos criada.')
  }

  // Calculate volume of a single roll
  // 2.20m x 5.0m x 0.05m = 0.55 m³
  const rollVolume = 2.20 * 5.0 * 0.05 // 0.55

  // Create Foams
  const foamsToCreate = [
    { name: 'Espuma D20 (Rolo 5cm)', color: 'Branca', costM3: 450.00 },
    { name: 'Espuma D23 (Rolo 5cm)', color: 'Cinza', costM3: 520.00 },
    { name: 'Espuma D28 (Rolo 5cm)', color: 'Amarela', costM3: 650.00 },
    { name: 'Espuma D33 (Rolo 5cm)', color: 'Azul', costM3: 800.00 },
    { name: 'Espuma D45 (Rolo 5cm)', color: 'Verde', costM3: 1100.00 },
    { name: 'Espuma HR50 (Alta Resiliência)', color: 'Rosa', costM3: 1500.00 }
  ]

  let count = 0
  for (const foam of foamsToCreate) {
    const exists = await prisma.supplyItem.findFirst({
      where: { name: foam.name }
    })

    if (!exists) {
      await prisma.supplyItem.create({
        data: {
          name: foam.name,
          categoryId: category.id,
          unit: 'M3',
          currentStock: rollVolume * 10, // Exemplo: 10 rolos em estoque
          minimumStock: rollVolume * 2, // Aviso quando tiver só 2 rolos
          averageCost: foam.costM3,
          primarySupplierId: supplier.id
        }
      })
      count++
      console.log(`Espuma: ${foam.name} adicionada.`)
    }
  }

  console.log(`Foram inseridas ${count} novas matrizes de espuma com sucesso.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
