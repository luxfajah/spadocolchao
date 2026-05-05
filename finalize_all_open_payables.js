const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_ACCOUNT_ID = 'acc_santander';

async function main() {
  const payables = await prisma.accountPayable.findMany({
    where: { status: { not: 'PAID' } },
    include: {
      financialCategory: true,
      costCenter: true,
    }
  });

  console.log(`Starting finalization of ${payables.length} payables...`);

  for (const payable of payables) {
    const pendingAmount = payable.amount - payable.paidAmount;
    if (pendingAmount < 0) {
      console.warn(`Payable ${payable.id} (${payable.description}) has negative pending amount. Skipping...`);
      continue;
    }

    const accountId = payable.financialAccountId || DEFAULT_ACCOUNT_ID;
    
    // Check if account exists
    const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      console.error(`Account ${accountId} not found for payable ${payable.id}. Skipping...`);
      continue;
    }

    console.log(`Processing: ${payable.description} (R$ ${pendingAmount.toFixed(2)})`);

    await prisma.$transaction(async (tx) => {
      // 1. Create FinancialTransaction
      const transaction = await tx.financialTransaction.create({
        data: {
          type: 'EXIT',
          amount: pendingAmount,
          transactionDate: new Date(),
          description: `Liquidação Final: ${payable.description}`,
          status: 'CONFIRMED',
          financialAccountId: accountId,
          financialCategoryId: payable.financialCategoryId,
          performedById: null, // No specific user
        }
      });

      // 2. Create PaymentAllocation
      await tx.paymentAllocation.create({
        data: {
          transactionId: transaction.id,
          accountPayableId: payable.id,
          amountAllocated: pendingAmount,
        }
      });

      // 3. Update AccountPayable
      await tx.accountPayable.update({
        where: { id: payable.id },
        data: {
          status: 'PAID',
          paidAmount: payable.amount,
          paymentDate: new Date(),
        }
      });

      // 4. Update FinancialAccount Balance
      await tx.financialAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            decrement: pendingAmount
          }
        }
      });
    });
  }

  console.log('Finalization complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
