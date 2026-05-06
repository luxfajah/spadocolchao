import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- INICIANDO LIMPEZA TOTAL DE VENDAS E CLIENTES ---')

  try {
    // 1. Limpeza de Entregas e Fichas de Produção
    console.log('Removendo Entregas e Fichas de Produção...')
    await prisma.orderDelivery.deleteMany()
    await prisma.orderProductionSlipLine.deleteMany()
    await prisma.orderProductionSlip.deleteMany()

    // 2. Limpeza de Histórico e Notas de Pedidos
    console.log('Removendo Histórico e Notas de Pedidos...')
    await prisma.orderStatusHistory.deleteMany()
    await prisma.orderNote.deleteMany()

    // 3. Limpeza de Detalhes Técnicos de Itens
    console.log('Removendo Detalhes Técnicos e Requisitos de Materiais...')
    await prisma.saleItemMaterialRequirement.deleteMany()
    await prisma.saleItemDetailMattressReform.deleteMany()
    await prisma.saleItemDetailBoxReform.deleteMany()
    await prisma.saleItemDetailNewMattress.deleteMany()
    await prisma.saleItemDetailNewBox.deleteMany()
    await prisma.saleItemDetailUpholsteryCleaningRow.deleteMany()
    await prisma.saleItemDetailUpholsteryCleaning.deleteMany()

    // 4. Limpeza de Itens e Parcelas
    console.log('Removendo Itens de Venda e Parcelas...')
    await prisma.saleItem.deleteMany()
    await prisma.saleInstallment.deleteMany()

    // 5. Limpeza de Comissões e Metas
    console.log('Removendo Comissões e Metas de Vendedores...')
    await prisma.commissionEntry.deleteMany()
    await prisma.commissionBatch.deleteMany()
    await prisma.sellerGoal.deleteMany()

    // 6. Limpeza de Pedidos e Vendas
    console.log('Removendo Pedidos e Vendas...')
    await prisma.order.deleteMany()
    await prisma.sale.deleteMany()

    // 7. Limpeza de Financeiro vinculado a vendas (Contas a Receber)
    console.log('Removendo Contas a Receber vinculadas...')
    await prisma.accountReceivable.deleteMany()
    
    // 8. Limpeza de Clientes (e seus dependentes)
    console.log('Removendo Dados de Clientes...')
    await prisma.customerNote.deleteMany()
    await prisma.customerCreditHistory.deleteMany()
    await prisma.customerContact.deleteMany()
    await prisma.customerAddress.deleteMany()
    await prisma.customer.deleteMany()

    console.log('--- LIMPEZA CONCLUÍDA COM SUCESSO ---')
  } catch (error) {
    console.error('Erro durante a limpeza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
