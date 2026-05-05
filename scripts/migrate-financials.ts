import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migração de SaleInstallment para AccountReceivable...');

  // 1. Verificar se existem registros
  const installments = await prisma.saleInstallment.findMany({
    include: {
      sale: {
        select: {
          number: true,
          customerId: true,
        }
      }
    }
  });

  console.log(`📊 Encontradas ${installments.length} parcelas para migrar.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const inst of installments) {
    // Verificar se já existe (idempotência)
    const existing = await prisma.accountReceivable.findUnique({
      where: { saleInstallmentId: inst.id }
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // Mapear status
    let status = 'PENDING';
    if (inst.paidAmount >= inst.amount) {
      status = 'RECEIVED';
    } else if (inst.paidAmount > 0) {
      status = 'PARTIALLY_RECEIVED';
    } else if (inst.dueDate < new Date() && inst.paidAmount === 0) {
      status = 'OVERDUE';
    }

    if (inst.status === 'CANCELLED') status = 'CANCELLED';

    await prisma.accountReceivable.create({
      data: {
        saleId: inst.saleId,
        saleInstallmentId: inst.id,
        customerId: inst.sale.customerId,
        description: `Parcela ${inst.installmentNumber} da Venda #${inst.sale.number || inst.saleId.substring(0, 8)}`,
        dueDate: inst.dueDate,
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        status: status,
        issueDate: inst.createdAt,
        receivedDate: inst.paidAt,
        notes: inst.notes,
      }
    });

    migratedCount++;
  }

  console.log(`✅ Migração concluída!`);
  console.log(`- Migrados: ${migratedCount}`);
  console.log(`- Pulados: ${skippedCount} (já existentes)`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
