import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Tables to KEEP (configs, produtos/insumos e cargos/escalas)
const keepTables = new Set([
  "_prisma_migrations",
  "SystemSetting",
  "SystemSettingHistory",
  "Role",
  "Permission",
  "RolePermission",
  "User",
  "UserRole",
  "CompanyProfile",
  "JobTitle", // cargos
  "WorkSchedule", // escalas
  "CompanyHoliday",
  "AppSetting",
  "SystemAutomation",
  "DocumentSequence",
  "PrinterProfile",
  "ProductService", // produtos
  "ProductRecipe",
  "ProductRecipeItem",
  "ProductRecipeItemRule",
  "SupplyCategory", // insumos
  "SupplyItem",
  "Supplier",
  "SupplierSupplyItem",
])

async function main() {
  const tables: Array<{ name: string }> = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`,
  )

  const toDelete = tables.map((t) => t.name).filter((name) => !keepTables.has(name))

  console.log("Tabelas que serao limpas:", toDelete.join(", "))

  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF;`)

  for (const table of toDelete) {
    console.log(`Apagando dados de ${table}...`)
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`)
  }

  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`)
  console.log("Concluido.")
}

main()
  .catch((error) => {
    console.error("Erro ao limpar dados", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
