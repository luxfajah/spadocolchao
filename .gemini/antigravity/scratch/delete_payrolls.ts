import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Deletando documentos do tipo PAYROLL (holerites)...")
  
  const result = await prisma.employeeDocument.deleteMany({
    where: {
      type: "PAYROLL"
    }
  })

  console.log(`Sucesso: ${result.count} holerites deletados.`)
}

main()
  .catch((e) => {
    console.error("Erro:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
