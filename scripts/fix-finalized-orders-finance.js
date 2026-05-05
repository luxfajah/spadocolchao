const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_ACCOUNT_ID = "acc_santander";
const DEFAULT_CATEGORY_ID = "cmncocgiw0000kkw65f7hytmo";

async function main() {
  const finalizedOrders = await prisma.order.findMany({
    where: { 
      currentStatus: 'FINALIZED'
    },
    include: { 
      sale: {
        include: {
          customer: true,
          accountsReceivable: {
            include: {
              paymentAllocations: {
                include: {
                  transaction: true
                }
              }
            }
          }
        }
      } 
    }
  });

  console.log(`Encontrados ${finalizedOrders.length} pedidos finalizados.`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const order of finalizedOrders) {
    const sale = order.sale;
    
    // Verificar se já existe alguma transação de ENTRADA vinculada a esta venda
    const hasTransactions = sale.accountsReceivable.some(ar => 
      ar.paymentAllocations.some(pa => pa.transaction.type === 'ENTRY')
    );

    if (hasTransactions && order.paidAt) {
      console.log(`[-] Pedido ${order.id} (#${order.code || '---'}) já tem transação financeira de entrada. Pulando.`);
      skippedCount++;
      continue;
    }

    // Se não tem transações, vamos registrar o valor TOTAL da venda no fluxo de caixa
    const amountToRecord = sale.totalAmount;
    console.log(`[!] Sincronizando Pedido ${order.id} (#${order.code || '---'}). Registrando R$ ${amountToRecord} no Fluxo de Caixa.`);

    const transactionDate = order.deliveredAt || order.readyForDeliveryAt || order.updatedAt || new Date();

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Criar Transação Financeira principal
        const transaction = await tx.financialTransaction.create({
          data: {
            type: "ENTRY",
            amount: amountToRecord,
            transactionDate: transactionDate,
            description: `Registro Fluxo de Caixa Pedido #${order.code || '---'} - ${sale.customer.fullName}`,
            status: "CONFIRMED",
            financialAccountId: DEFAULT_ACCOUNT_ID,
            financialCategoryId: DEFAULT_CATEGORY_ID,
          }
        });

        // 2. Atualizar Saldo da Conta
        await tx.financialAccount.update({
          where: { id: DEFAULT_ACCOUNT_ID },
          data: {
            currentBalance: { increment: amountToRecord }
          }
        });

        // 3. Tentar encontrar Conta a Receber vinculada ou criar uma
        let receivable = await tx.accountReceivable.findFirst({
          where: { saleId: sale.id }
        });

        if (!receivable) {
          receivable = await tx.accountReceivable.create({
            data: {
              saleId: sale.id,
              customerId: sale.customerId,
              description: `Saldo Pedido #${order.code || '---'} (Sincronizado)`,
              amount: sale.totalAmount,
              paidAmount: sale.totalAmount,
              dueDate: transactionDate,
              status: "RECEIVED",
              receivedDate: transactionDate,
              financialCategoryId: DEFAULT_CATEGORY_ID,
              financialAccountId: DEFAULT_ACCOUNT_ID
            }
          });
        } else {
           // Atualizar título existente
           await tx.accountReceivable.update({
             where: { id: receivable.id },
             data: {
               paidAmount: sale.totalAmount,
               status: "RECEIVED",
               receivedDate: transactionDate,
               financialAccountId: DEFAULT_ACCOUNT_ID
             }
           });
        }

        // 4. Vincular Pagamento
        await tx.paymentAllocation.create({
          data: {
            transactionId: transaction.id,
            accountReceivableId: receivable.id,
            amountAllocated: amountToRecord
          }
        });

        // 5. Garantir consistência da Venda e Pedido
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            paidAmount: sale.totalAmount,
            financialStatus: "PAID"
          }
        });

        await tx.order.update({
          where: { id: order.id },
          data: {
            paidAt: transactionDate
          }
        });
      });
      processedCount++;
    } catch (error) {
      console.error(`[!] Erro ao processar pedido ${order.id}:`, error.message);
    }
  }

  console.log(`\n--- RESUMO FINAL ---`);
  console.log(`Processados: ${processedCount}`);
  console.log(`Ignorados: ${skippedCount}`);
  process.exit(0);
}

main();
