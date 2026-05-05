import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando carga de insumos de acabamento...')

  // Get or Create Supplier
  let supplier = await prisma.supplier.findFirst({
    where: { tradeName: 'Acessórios Industriais Ltda' }
  })

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        tradeName: 'Acessórios Industriais Ltda',
        legalName: 'Acessórios Industriais S/A',
        document: '88.888.888/0001-88',
        personType: 'JURIDICA',
        isActive: true
      }
    })
    console.log('Fornecedor de acabamentos criado.')
  }

  // Get or Create Category
  let category = await prisma.supplyCategory.findFirst({
    where: { name: 'Acessórios e Acabamentos' }
  })

  if (!category) {
    category = await prisma.supplyCategory.create({
      data: { name: 'Acessórios e Acabamentos' }
    })
    console.log('Categoria Acessórios e Acabamentos criada.')
  }

  // Define Items (Tapes in Meters, Feet in Units)
  const itemsToCreate = [
    { name: 'Fita de Borda Branca 35mm', unit: 'M', cost: 1.20, stock: 5000 },
    { name: 'Fita de Borda Preta 35mm', unit: 'M', cost: 1.20, stock: 3000 },
    { name: 'Fita de Borda Areia 40mm', unit: 'M', cost: 1.50, stock: 1500 },
    { name: 'Pezinho de Madeira Tabaco 12cm', unit: 'UN', cost: 8.50, stock: 400 },
    { name: 'Pezinho de Alumínio Polido 12cm', unit: 'UN', cost: 15.00, stock: 200 },
    { name: 'Pezinho c/ Rodízio Alumínio 12cm', unit: 'UN', cost: 18.00, stock: 150 }
  ]

  let count = 0
  for (const item of itemsToCreate) {
    const exists = await prisma.supplyItem.findFirst({
      where: { name: item.name }
    })

    if (!exists) {
      await prisma.supplyItem.create({
        data: {
          name: item.name,
          categoryId: category.id,
          unit: item.unit,
          currentStock: item.stock,
          minimumStock: item.unit === 'UN' ? 50 : 500,
          averageCost: item.cost,
          primarySupplierId: supplier.id
        }
      })
      count++
      console.log(`Insumo: ${item.name} adicionado.`)
    }
  }

  console.log(`Foram inseridos ${count} novos acessórios e fitas com sucesso.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
