const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SANTANDER_ID = 'acc_santander';
const TARGET_REVENUE = 389000;
const SALES_COUNT = 97;
const CUSTOMERS_TO_CREATE = 80;

const LEAD_SOURCES = [
  'cmncls45k0000rrvae9bfezk5', // Instagram
  'cmncls4do0001rrvazpxa8jgy', // Facebook
  'cmncls4ju0002rrvaa4mb392e', // Indicação
  'cmncls4pp0003rrva5fazogt1', // Google Ads
  'cmncls4yn0004rrvafgxh6hv5', // Loja Física
  'cmncnvf8x000ps51l6t9dymix'  // Venda externa
];

const SELLERS = [
  'cmncl982b000bs51lc2q5j9fu', // Mateus
  'cmncl98mf000ds51lsw4tdxtb', // Leticia
  'cmncl98sc000fs51l0bh7q3ej', // Bruno
  'cmncl98yh000hs51lvd24czq4'  // Renata
];

const PRODUCTS = [
  { id: 'cmn86kg3k0007g3d9qcvedtuq', name: 'Cama Personalizada Completa', price: 4800 },
  { id: 'cmn86kfyx0006g3d98geer874', name: 'Colchão Novo Sob Medida', price: 2890 },
  { id: 'cmn86kfu60005g3d9nccl5c0f', name: 'Cama Box Baú (Nova)', price: 1550 },
  { id: 'cmn86kf2e0002g3d9zdk5go13', name: 'Reforma de Colchão (Profunda)', price: 1450 },
  { id: 'cmn86kevh0001g3d90l60wlzw', name: 'Reforma de Colchão (Média)', price: 950 },
  { id: 'cmn86kfmw0004g3d9yf2hvh2i', name: 'Cama Box Padrão (Nova)', price: 850 }
];

async function main() {
  console.log('Iniciando Maratona de Vendas de Março...');

  // 1. Create 80 Customers
  console.log(`Criando ${CUSTOMERS_TO_CREATE} novos clientes...`);
  const newCustomers = [];
  const names = [
    'Adriana', 'Bruno', 'Carla', 'Diego', 'Eliana', 'Fabio', 'Gisele', 'Helio', 'Iara', 'Joao',
    'Karen', 'Lucas', 'Marisa', 'Nilo', 'Olivia', 'Paulo', 'Quiteria', 'Ricardo', 'Sandra', 'Tiago',
    'Ursula', 'Vitor', 'Wanda', 'Xavier', 'Yara', 'Zeca', 'Aline', 'Beto', 'Celia', 'Dante'
  ];
  const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];

  for (let i = 0; i < CUSTOMERS_TO_CREATE; i++) {
    const name = names[i % names.length] + ' ' + surnames[Math.floor(Math.random() * surnames.length)] + ' ' + (i + 1);
    const customer = await prisma.customer.create({
      data: {
        fullName: name,
        email: `cliente${i + 1}@email.com`,
        phone: `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`,
        isActive: true,
        personType: 'INDIVIDUAL'
      }
    });
    newCustomers.push(customer);
  }

  // 2. Prepare Sales stats
  let currentTotal = 0;
  const salesData = [];
  
  // Distribute prices to hit TARGET_REVENUE
  for (let i = 0; i < SALES_COUNT; i++) {
    const isLast = (i === SALES_COUNT - 1);
    let price;
    if (isLast) {
      price = TARGET_REVENUE - currentTotal;
    } else {
      // Randomly pick a product price as a base
      const prod = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      price = prod.price + (Math.random() * 200 - 100); // Small variance
    }
    
    // Safety check for unrealistic prices in logic
    if (price < 100) price = 4000; // fallback
    
    currentTotal += price;
    salesData.push({ amount: price });
  }

  // 3. Create 97 Sales
  console.log(`Injetando ${SALES_COUNT} vendas para Março de 2026...`);
  
  for (let i = 0; i < SALES_COUNT; i++) {
    const amount = salesData[i].amount;
    const customer = newCustomers[i % newCustomers.length];
    const sellerId = SELLERS[i % SELLERS.length];
    const leadSourceId = LEAD_SOURCES[i % LEAD_SOURCES.length];
    
    // Spread dates across March
    const day = Math.floor(Math.random() * 30) + 1;
    const saleDate = new Date(2026, 2, day, 10 + (i % 8), 0, 0);
    
    const now = new Date(); // March 30, 2026 as per user context
    const promisedDate = new Date(saleDate);
    promisedDate.setDate(promisedDate.getDate() + 10);

    // One specific sale (index 50) will be "Atrasado"
    const isDelayed = (i === 50);
    
    let orderStatus = 'DELIVERED';
    let deliveredAt = new Date(saleDate);
    deliveredAt.setDate(deliveredAt.getDate() + 7);

    if (day > 25 && !isDelayed) {
      orderStatus = (i % 2 === 0) ? 'PRODUCTION' : 'SOLD';
      deliveredAt = null;
    } else if (isDelayed) {
      orderStatus = 'SOLD';
      deliveredAt = null;
      // promisedDate was 10 days after mid-march, likely passed
      promisedDate.setDate(saleDate.getDate() + 5); 
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          number: 'VEND-MAR-' + (i + 1).toString().padStart(3, '0'),
          customerId: customer.id,
          sellerId: sellerId,
          leadSourceId: leadSourceId,
          saleDate: saleDate,
          subtotalAmount: amount,
          totalAmount: amount,
          paidAmount: amount,
          status: 'CONFIRMED',
          financialStatus: 'PAID',
          notes: isDelayed ? 'Pedido com atraso na matéria-prima' : 'Venda simulada maratona março'
        }
      });

      // 2. Create SaleItem
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          description: 'Combo Maratona Março (Mix de Produtos)',
          quantity: 1,
          unitPrice: amount,
          totalAmount: amount
        }
      });

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          saleId: sale.id,
          customerId: customer.id,
          sellerId: sellerId,
          currentStatus: orderStatus,
          promisedDate: promisedDate,
          deliveredAt: deliveredAt,
          createdAt: saleDate
        }
      });

      // 4. Create Order History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: orderStatus,
          notes: 'Status inicial da maratona',
          changedAt: saleDate
        }
      });

      // 5. Account Receivable
      const receivable = await tx.accountReceivable.create({
        data: {
          saleId: sale.id,
          description: `Recebimento Venda ${sale.number}`,
          dueDate: saleDate,
          amount: amount,
          paidAmount: amount,
          status: 'RECEIVED',
          receivedDate: saleDate,
          financialAccountId: SANTANDER_ID
        }
      });

      // 6. Financial Transaction
      const transaction = await tx.financialTransaction.create({
        data: {
          type: 'ENTRY',
          amount: amount,
          transactionDate: saleDate,
          description: `Venda Maratona: ${sale.number}`,
          status: 'CONFIRMED',
          financialAccountId: SANTANDER_ID,
          createdAt: saleDate
        }
      });

      // 7. Payment Allocation
      await tx.paymentAllocation.create({
        data: {
          transactionId: transaction.id,
          accountReceivableId: receivable.id,
          amountAllocated: amount,
          createdAt: saleDate
        }
      });

      // 8. Update Account Balance
      await tx.financialAccount.update({
        where: { id: SANTANDER_ID },
        data: {
          currentBalance: {
            increment: amount
          }
        }
      });
    });

    if (i % 10 === 0) console.log(`Progresso: ${i}/${SALES_COUNT} vendas concluídas.`);
  }

  console.log('Maratona de Vendas Concluída!');
  console.log(`Total Final Injetado: R$ ${currentTotal.toFixed(2)}`);
  console.log(`80 clientes criados. 97 vendas processadas (1 delayed).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
