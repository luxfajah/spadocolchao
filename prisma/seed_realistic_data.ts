import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const TARGET_MARCH_REVENUE = 209000;
const MARCH_DAYS = 31;
const APRIL_DAYS = 5;

// Distribuição para atingir R$ 209.000 (média de ~6.7k por dia, ou seja, de 2 a 4 vendas por dia)
const AVG_TICKET = 2000; // Ticket médio simulado
const MARCH_SALES_COUNT = Math.floor(TARGET_MARCH_REVENUE / AVG_TICKET);
const APRIL_SALES_COUNT = Math.floor(MARCH_SALES_COUNT / MARCH_DAYS) * APRIL_DAYS; // Proporcional

async function main() {
  console.log(`Iniciando injeção de dados realistas...`);
  console.log(`Meta Março 2026: R$ ${TARGET_MARCH_REVENUE.toLocaleString('pt-BR')} (~${MARCH_SALES_COUNT} vendas)`);
  console.log(`Meta primeiros 5 dias Abril 2026: ~${APRIL_SALES_COUNT} vendas`);

  // 1. Setup Base - Conta Financeira
  let account = await prisma.financialAccount.findFirst({ where: { name: 'Santander Principal' } });
  if (!account) {
    account = await prisma.financialAccount.create({
      data: {
        name: 'Santander Principal',
        type: 'BANK_ACCOUNT',
        bankName: 'Santander',
        agency: '1234',
        accountNumber: '56789-0',
        initialBalance: 0,
        status: 'ACTIVE',
      }
    });
  }

  // Obter Vendedor
  let seller = await prisma.seller.findFirst({ where: { name: 'João Vendedor' } });
  if (!seller) {
    seller = await prisma.seller.create({
      data: { name: 'João Vendedor', type: 'INTERNAL', defaultCommissionRate: 5.0, isActive: true }
    });
  }

  // Obter ou criar Produtos
  const productA = await prisma.productService.upsert({
    where: { code: 'REF-CASAL' },
    update: {},
    create: { code: 'REF-CASAL', name: 'Reforma de Colchão Casal', type: 'SERVICE', defaultPrice: 1850.0, isActive: true }
  });
  const productB = await prisma.productService.upsert({
    where: { code: 'REF-SOLT' },
    update: {},
    create: { code: 'REF-SOLT', name: 'Reforma de Colchão Solteiro', type: 'SERVICE', defaultPrice: 950.0, isActive: true }
  });
  const productC = await prisma.productService.upsert({
    where: { code: 'NOVO-SOB-MEDIDA' },
    update: {},
    create: { code: 'NOVO-SOB-MEDIDA', name: 'Fabricação de Colchão Sob Medida', type: 'PRODUCT', defaultPrice: 3500.0, isActive: true }
  });
  const PRODUCTS = [productA, productB, productC];

  // Obter Lead Sources
  let leadSources = await prisma.leadSource.findMany();
  if (leadSources.length === 0) {
    leadSources = [await prisma.leadSource.create({ data: { code: 'INSTA', name: 'Instagram', isActive: true, category: 'Digital orgânica' } })];
  }

  // 2. Gerar Clientes
  console.log(`Criando massa de clientes...`);
  const newCustomers = [];
  const firstNames = ['Ana', 'Carlos', 'Beatriz', 'Marcos', 'Fernanda', 'Lucas', 'Juliana', 'Rafael', 'Mariana', 'Roberto', 'Luiza', 'Ricardo'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Alves', 'Lima', 'Gomes', 'Martins', 'Ferreira'];
  
  for (let i = 0; i < 60; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const customer = await prisma.customer.create({
      data: {
        fullName: `${fName} ${lName} (Simulado ${i+1})`,
        phone: `119${Math.floor(10000000 + Math.random() * 90000000)}`,
        isActive: true,
        personType: 'INDIVIDUAL'
      }
    });
    newCustomers.push(customer);
  }

  // 3. Gerar Vendas
  const generateSales = async (month, days, targetSalesCount, isCurrentMonth) => {
    let accumulated = 0;
    
    for (let i = 0; i < targetSalesCount; i++) {
      // Distribuição aleatória dos dias no mês
      const day = Math.floor(Math.random() * days) + 1;
      const saleDate = new Date(2026, month, day, 10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      
      const customer = newCustomers[Math.floor(Math.random() * newCustomers.length)];
      const prod = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const leadSource = leadSources[Math.floor(Math.random() * leadSources.length)];
      
      // Variação de preço
      let amount = prod.defaultPrice + (Math.random() * 500 - 250);
      
      // Se for a última venda do mês, ajusta o valor para bater a meta exatamente (para Março)
      if (month === 2 /* Março */ && i === targetSalesCount - 1) {
        amount = TARGET_MARCH_REVENUE - accumulated;
        if (amount < 0) amount = prod.defaultPrice; // Fallback se já passou da meta acidentalmente
      }
      
      accumulated += amount;

      // Definir status do pedido com base no tempo
      let orderStatus = 'DELIVERED';
      let deliveredAt = new Date(saleDate);
      deliveredAt.setDate(deliveredAt.getDate() + 7);
      
      // Vendas recentes (fim de Março ou Abril) ficam em Produção
      if ((month === 2 && day >= 25) || month === 3) {
        orderStatus = (Math.random() > 0.5) ? 'PRODUCTION' : 'CONFIRMED';
        deliveredAt = null;
      }

      await prisma.$transaction(async (tx) => {
        // Venda
        const sale = await tx.sale.create({
          data: {
            number: `VEND-2026-${(month+1).toString().padStart(2, '0')}-${(i+1).toString().padStart(3, '0')}`,
            customerId: customer.id,
            sellerId: seller.id,
            leadSourceId: leadSource.id,
            saleDate: saleDate,
            subtotalAmount: amount,
            totalAmount: amount,
            paidAmount: amount,
            status: 'CONFIRMED',
            financialStatus: 'PAID',
            notes: 'Massa de teste realista simulada'
          }
        });

        // Item da Venda
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            description: prod.name,
            quantity: 1,
            unitPrice: amount,
            totalAmount: amount,
            productServiceId: prod.id
          }
        });

        // Pedido / Ordem de Serviço
        const promisedDate = new Date(saleDate);
        promisedDate.setDate(promisedDate.getDate() + 10);
        
        const order = await tx.order.create({
          data: {
            saleId: sale.id,
            customerId: customer.id,
            sellerId: seller.id,
            currentStatus: orderStatus,
            promisedDate: promisedDate,
            deliveredAt: deliveredAt,
            createdAt: saleDate
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            toStatus: orderStatus,
            notes: 'Simulação histórica',
            changedAt: saleDate
          }
        });

        // Contas a Receber
        const receivable = await tx.accountReceivable.create({
          data: {
            saleId: sale.id,
            customerId: customer.id,
            description: `Recebimento Ref. ${sale.number}`,
            dueDate: saleDate,
            amount: amount,
            paidAmount: amount,
            status: 'RECEIVED',
            receivedDate: saleDate,
            financialAccountId: account.id
          }
        });

        // Transação Financeira
        const transaction = await tx.financialTransaction.create({
          data: {
            type: 'ENTRY',
            amount: amount,
            transactionDate: saleDate,
            description: `Faturamento - ${sale.number}`,
            status: 'CONFIRMED',
            financialAccountId: account.id,
            createdAt: saleDate
          }
        });

        await tx.paymentAllocation.create({
          data: {
            transactionId: transaction.id,
            accountReceivableId: receivable.id,
            amountAllocated: amount,
            createdAt: saleDate
          }
        });
      });
    }
    
    return accumulated;
  };

  // Executar Março
  console.log(`Gerando vendas para Março (Mês 2, JS Data)...`);
  const marchTotal = await generateSales(2, MARCH_DAYS, MARCH_SALES_COUNT, false);
  console.log(`Março processado. Faturamento total inserido: R$ ${marchTotal.toLocaleString('pt-BR')}`);

  // Executar Abril
  console.log(`Gerando vendas para Abril (Mês 3, primeiros 5 dias)...`);
  const aprilTotal = await generateSales(3, APRIL_DAYS, APRIL_SALES_COUNT, true);
  console.log(`Abril processado. Faturamento total inserido: R$ ${aprilTotal.toLocaleString('pt-BR')}`);

  console.log('--- Resumo da Injeção ---');
  console.log(`Total Geral: R$ ${(marchTotal + aprilTotal).toLocaleString('pt-BR')}`);
  console.log(`Tabelas populadas: Customers, Sales, SaleItems, Orders, FinancialTransactions, AccountsReceivable`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
