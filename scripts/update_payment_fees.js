const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando configuração de taxas...')

  // 1. PIX (1%)
  await prisma.paymentMethod.upsert({
    where: { code: 'PIX' },
    update: { feePercentage: 1.0, type: 'PIX', isActive: true },
    create: { code: 'PIX', name: 'PIX', type: 'PIX', feePercentage: 1.0, isActive: true }
  })
  console.log('- PIX configurado: 1%')

  // 2. Débito (0.89%)
  await prisma.paymentMethod.upsert({
    where: { code: 'DEBITO' },
    update: { feePercentage: 0.89, type: 'DEBIT', isActive: true },
    create: { code: 'DEBITO', name: 'Cartão de Débito', type: 'DEBIT', feePercentage: 0.89, isActive: true }
  })
  console.log('- Débito configurado: 0.89%')

  // 3. Crédito Progressivo
  const creditMethod = await prisma.paymentMethod.upsert({
    where: { code: 'CREDIT_CARD' },
    update: { 
      name: 'Cartão de Crédito', 
      type: 'CREDIT', 
      allowsInstallments: true, 
      maxInstallments: 12, 
      isActive: true,
      feePercentage: 1.99 // Default fee (1x)
    },
    create: { 
      code: 'CREDIT_CARD', 
      name: 'Cartão de Crédito', 
      type: 'CREDIT', 
      allowsInstallments: true, 
      maxInstallments: 12, 
      isActive: true,
      feePercentage: 1.99
    }
  })

  // Taxas progressivas (1.99% a 13.01%)
  const fees = [
    { inst: 1, fee: 1.99 },
    { inst: 2, fee: 2.99 },
    { inst: 3, fee: 3.99 },
    { inst: 4, fee: 5.00 },
    { inst: 5, fee: 6.00 },
    { inst: 6, fee: 7.00 },
    { inst: 7, fee: 8.00 },
    { inst: 8, fee: 9.00 },
    { inst: 9, fee: 10.00 },
    { inst: 10, fee: 11.01 },
    { inst: 11, fee: 12.01 },
    { inst: 12, fee: 13.01 }
  ]

  for (const f of fees) {
    await prisma.paymentMethodInstallmentFee.upsert({
      where: {
        paymentMethodId_installments: {
          paymentMethodId: creditMethod.id,
          installments: f.inst
        }
      },
      update: { feePercentage: f.fee },
      create: {
        paymentMethodId: creditMethod.id,
        installments: f.inst,
        feePercentage: f.fee
      }
    })
  }

  console.log('- Crédito configurado: 1x (1.99%) a 12x (13.01%)')
  console.log('Taxas configuradas com sucesso!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
