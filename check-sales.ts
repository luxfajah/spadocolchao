import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const sales = await prisma.sale.findMany({
    select: { id: true, number: true, createdAt: true },
    orderBy: { createdAt: "asc" }
  })
  console.log("Total sales:", sales.length)
  console.log("Sales with number:", sales.filter(s => s.number).length)
  console.log("Sales without number:", sales.filter(s => !s.number).length)
  if (sales.length > 0) {
    console.log("First 5 sales:", sales.slice(0, 5))
    console.log("Last 5 sales:", sales.slice(-5))
  }
}
main()
