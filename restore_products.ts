import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Buscando produtos inativos (apagados)...")

  const inactiveProducts = await prisma.productService.findMany({
    where: { isActive: false },
  })

  if (inactiveProducts.length === 0) {
    console.log("Nenhum produto inativo encontrado.")
    return
  }

  console.log(`Encontrados ${inactiveProducts.length} produtos inativos. Restaurando...`)

  for (const product of inactiveProducts) {
    await prisma.productService.update({
      where: { id: product.id },
      data: { isActive: true },
    })
    console.log(`✅ Restaurado: ${product.name} (Tipo: ${product.type})`)
  }

  console.log("🎉 Todos os produtos inativos foram restaurados!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
