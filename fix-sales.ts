import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"
import { config } from "dotenv"

config({ path: ".env.local" })
config({ path: ".env" })

const prisma = new PrismaClient()

function generateSaleNumber(date: Date, sequence: number) {
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const seq = sequence.toString().padStart(4, '0')
  return `V-${year}${month}-${seq}`
}

async function main() {
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "asc" }
  })
  
  console.log(`Found ${sales.length} sales to process.`)
  
  let sequence = 1
  for (const sale of sales) {
    const newNumber = generateSaleNumber(sale.createdAt, sequence)
    await prisma.sale.update({
      where: { id: sale.id },
      data: { number: newNumber }
    })
    sequence++
  }
  
  console.log(`Successfully generated and applied codes for ${sales.length} sales!`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
