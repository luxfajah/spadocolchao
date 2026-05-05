
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = 'acc_santander';
  const userId = 'cmn7yhpub0001spu7aersdab2';
  const march30 = new Date('2026-03-30T12:00:00Z');

  // 1. Create Marketing Category
  const marketingCategory = await prisma.financialCategory.upsert({
    where: { code: 'MARKETING' },
    update: {},
    create: {
      code: 'MARKETING',
      name: 'Marketing e Publicidade',
      type: 'EXIT',
      description: 'Gastos com tráfego pago, agência, ferramentas e materiais de divulgação.',
      isActive: true
    }
  });
  console.log('Category created/verified:', marketingCategory.id);

  const expenses = [
    { desc: 'Meta Ads (Instagram/Facebook) - Investimento Março', amount: 15000 },
    { desc: 'Google Ads (Search/Shopping) - Investimento Março', amount: 10000 },
    { desc: 'Mensalidade Agência Digital / Produção de Conteúdo', amount: 5000 },
    { desc: 'Marketing Local e Materiais Gráficos (Flyers/Fachada)', amount: 3000 },
    { desc: 'Ferramentas de Marketing (RD Station / Zapier)', amount: 3000 }
  ];

  for (const exp of expenses) {
    // A. Create AccountPayable (Paid)
    const payable = await prisma.accountPayable.create({
      data: {
        description: exp.desc,
        amount: exp.amount,
        paidAmount: exp.amount,
        dueDate: march30,
        issueDate: march30,
        paymentDate: march30,
        status: 'PAID',
        financialCategoryId: marketingCategory.id,
        financialAccountId: accountId,
        notes: 'Registro de gasto realista de marketing baseado no faturamento.'
      }
    });

    // B. Create FinancialTransaction (Exit)
    const transaction = await prisma.financialTransaction.create({
      data: {
        type: 'EXIT',
        amount: exp.amount,
        transactionDate: march30,
        description: exp.desc,
        status: 'CONFIRMED',
        financialAccountId: accountId,
        financialCategoryId: marketingCategory.id,
        performedById: userId
      }
    });

    // C. Create PaymentAllocation
    await prisma.paymentAllocation.create({
      data: {
        transactionId: transaction.id,
        accountPayableId: payable.id,
        amountAllocated: exp.amount
      }
    });

    // D. Update Account Balance
    await prisma.financialAccount.update({
      where: { id: accountId },
      data: {
        currentBalance: { decrement: exp.amount }
      }
    });

    console.log(`Registered: ${exp.desc} - R$ ${exp.amount}`);
  }

  console.log('All marketing expenses registered successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
