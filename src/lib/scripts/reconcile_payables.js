const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando Reconciliação Financeira - Março 2026...");

  // 1. Buscar Conta Corrente Principal
  const defaultAccount = await prisma.financialAccount.findFirst({
    where: { status: "ACTIVE" }
  });

  if (!defaultAccount) {
    console.error("Nenhuma conta financeira ativa encontrada!");
    return;
  }
  console.log(`Usando conta default: ${defaultAccount.name}`);

  // 2. Buscar Títulos pagos em Março sem alocações
  const start = new Date('2026-03-01T00:00:00Z');
  const end = new Date('2026-03-31T23:59:59Z');

  const payables = await prisma.accountPayable.findMany({
    where: {
      status: 'PAID',
      dueDate: { gte: start, lte: end },
      paymentAllocations: { none: {} }
    },
    include: {
      paymentAllocations: true
    }
  });

  console.log(`Encontrados ${payables.length} títulos para reconciliar.`);

  let totalReconciled = 0;
  let totalAmount = 0;

  for (const title of payables) {
    const accountId = title.financialAccountId || defaultAccount.id;
    const amountToSync = title.amount;
    const syncDate = title.paymentDate || title.dueDate;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Criar Transação Financeira
        const transaction = await tx.financialTransaction.create({
          data: {
            type: "EXIT",
            amount: amountToSync,
            transactionDate: syncDate,
            description: `Reconciliação: ${title.description}`,
            status: "CONFIRMED",
            financialAccountId: accountId,
            financialCategoryId: title.financialCategoryId
          }
        });

        // 2. Criar Alocação de Pagamento
        await tx.paymentAllocation.create({
          data: {
            transactionId: transaction.id,
            accountPayableId: title.id,
            amountAllocated: amountToSync
          }
        });

        // 3. Atualizar Título (se financialAccountId era null)
        if (!title.financialAccountId) {
          await tx.accountPayable.update({
            where: { id: title.id },
            data: { financialAccountId: accountId }
          });
        }

        // 4. Decrementar Saldo da Conta
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { currentBalance: { decrement: amountToSync } }
        });
      });

      totalReconciled++;
      totalAmount += amountToSync;
    } catch (error) {
      console.error(`Erro ao reconciliar título ${title.id}:`, error.message);
    }
  }

  console.log(`Reconciliação concluída!`);
  console.log(`Total de títulos fixados: ${totalReconciled}`);
  console.log(`Total de valor contabilizado: R$ ${totalAmount.toFixed(2)}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
