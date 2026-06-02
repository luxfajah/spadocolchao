import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Generating 4 test orders in WAITING_DELIVERY status...")

  // Get a random customer to link these orders to, or create a dummy one
  let customer = await prisma.customer.findFirst({
    where: { fullName: 'Cliente de Teste App Entregador' }
  })
  
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        fullName: 'Cliente de Teste App Entregador',
        personType: 'INDIVIDUAL',
        phone: '43999999999'
      }
    })
  }

  // Get a dummy sale to link to (Required by the schema)
  let sale = await prisma.sale.findFirst({
    where: { status: 'SOLD', customerId: customer.id }
  })
  
  if (!sale) {
    // Need a seller for the sale (find the first active internal seller or create one)
    let seller = await prisma.seller.findFirst({ where: { isActive: true } })
    if (!seller) {
       seller = await prisma.seller.create({
         data: { name: 'Vendedor Teste', isActive: true, type: 'INTERNAL' }
       })
    }

    // Need a valid session for the sale
    let session = await prisma.cashRegisterSession.findFirst({ where: { status: 'OPEN' } })
    if (!session) {
      // Find a user
      const user = await prisma.user.findFirst()
      if (!user) throw new Error("No users found to create a session")
      
      session = await prisma.cashRegisterSession.create({
        data: {
          openedById: user.id,
          openingBalance: 0,
          status: 'OPEN'
        }
      })
    }

    sale = await prisma.sale.create({
      data: {
        customerId: customer.id,
        sellerId: seller.id,
        sessionId: session.id,
        status: 'SOLD',
        subtotalAmount: 1000,
        totalAmount: 1000,
        paymentStatus: 'PENDING'
      }
    })
  }

  const addresses = [
    { street: 'Av colibri', number: '77', cep: '86705-000' },
    { street: 'Av beija flor', number: '247', cep: '86706-000' },
    { street: 'Rua bentevi', number: '12', cep: '86707-000' },
    { street: 'Rua azulão', number: '48', cep: '86707-290' },
  ]

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i]
    // Each order requires a unique saleId in this schema.
    // So we need to create a new sale for each order to satisfy the unique constraint.
    let currentSale = sale
    if (i > 0) {
      currentSale = await prisma.sale.create({
        data: {
          customerId: customer.id,
          sellerId: sale.sellerId,
          sessionId: sale.sessionId,
          status: 'SOLD',
          subtotalAmount: 1000,
          totalAmount: 1000,
          paymentStatus: 'PENDING'
        }
      })
    }

    const order = await prisma.order.create({
      data: {
        saleId: currentSale.id,
        customerId: customer.id,
        currentStatus: 'WAITING_DELIVERY',
        deliveryDate: new Date(),
        street: addr.street,
        number: addr.number,
        zipCode: addr.cep,
        neighborhood: 'Jardim dos Pássaros',
        city: 'Arapongas',
        state: 'PR',
        recipientName: 'Recebedor ' + (i + 1),
        code: 'TEST-' + Math.floor(Math.random() * 10000)
      }
    })
    console.log(`Created order ${order.code} at ${addr.street}, ${addr.number}`)
  }

  console.log("Done!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
