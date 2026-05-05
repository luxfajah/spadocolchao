const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando Liquidação Total de Títulos em Aberto...");

  // 1. Buscar Conta Corrente Principal
  const defaultAccount = await prisma.financialAccount.findFirst({
    where: { status: "ACTIVE" }
  });

  if (!defaultAccount) {
    console.error("Nenhuma conta financeira ativa encontrada!");
    return;
  }
  console.log(`Usando conta para liquidação: ${defaultAccount.name}`);

  // 2. Buscar TODOS os títulos pendentes ou parciais
  const pendingTitles = await prisma.accountPayable.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIALLY_PAID'] }
    }
  });

  console.log(`Encontrados ${pendingTitles.length} títulos pendentes no sistema.`);

  let totalPaid = 0;
  let totalAmount = 0;

  for (const title of pendingTitles) {
    const accountId = title.financialAccountId || defaultAccount.id;
    const remainingAmount = title.amount - (title.paidAmount || 0);
    const paymentDate = new Date();

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Criar Transação Financeira de Saída
        const transaction = await tx.financialTransaction.create({
          data: {
            type: "EXIT",
            amount: remainingAmount,
            transactionDate: paymentDate,
            description: `Liquidação Final: ${title.description}`,
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
            amountAllocated: remainingAmount
          }
        });

        // 3. Atualizar Status do Título para PAID
        await tx.accountPayable.update({
          where: { id: title.id },
          data: {
            status: "PAID",
            paidAmount: title.amount,
            paymentDate: paymentDate,
            financialAccountId: accountId
          }
        });

        // 4. Atualizar Saldo da Conta
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { currentBalance: { decrement: remainingAmount } }
        });
      });

      totalPaid++;
      totalAmount += remainingAmount;
    } catch (error) {
      console.error(`Erro ao liquidar título ${title.id}:`, error.message);
    }
  }

  console.log(`Liquidação concluída com sucesso!`);
  console.log(`Títulos liquidados: ${totalPaid}`);
  console.log(`Valor total movimentado: R$ ${totalAmount.toFixed(2)}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
