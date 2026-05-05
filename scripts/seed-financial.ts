import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Semeando dados financeiros iniciais...');

  // 1. Centros de Custo
  const costCenters = [
    { code: 'ADM', name: 'Administrativo' },
    { code: 'COM', name: 'Comercial/Vendas' },
    { code: 'PROD', name: 'Produção/Fábrica' },
    { code: 'LOG', name: 'Logística/Entrega' },
  ];

  for (const cc of costCenters) {
    await prisma.costCenter.upsert({
      where: { code: cc.code },
      update: {},
      create: cc,
    });
  }
  console.log('✅ Centros de Custo semeados.');

  // 2. Categorias Financeiras
  const categories = [
    { code: 'REC_VEND', name: 'Receita de Vendas', type: 'ENTRY' },
    { code: 'REC_SERV', name: 'Receita de Serviços', type: 'ENTRY' },
    { code: 'DESP_SAL', name: 'Salários e Encargos', type: 'EXIT' },
    { code: 'DESP_ALUG', name: 'Aluguel e Condomínio', type: 'EXIT' },
    { code: 'DESP_MAT', name: 'Insumos e Matéria Prima', type: 'EXIT' },
    { code: 'DESP_IMP', name: 'Impostos e Taxas', type: 'EXIT' },
    { code: 'DESP_MKT', name: 'Marketing e Propaganda', type: 'EXIT' },
    { code: 'DESP_FIN', name: 'Tarifas Bancárias', type: 'EXIT' },
    { code: 'TRANSF', name: 'Transferência entre Contas', type: 'BOTH' },
  ];

  for (const cat of categories) {
    await prisma.financialCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categorias Financeiras semeadas.');

  // 3. Contas Financeiras
  const accounts = [
    { name: 'Caixa Principal', type: 'CASH', initialBalance: 0 },
    { name: 'Banco Inter', type: 'BANK', bankName: 'Inter', initialBalance: 0 },
    { name: 'Banco Itaú', type: 'BANK', bankName: 'Itaú', initialBalance: 0 },
  ];

  for (const acc of accounts) {
    const existing = await prisma.financialAccount.findFirst({
      where: { name: acc.name }
    });
    if (!existing) {
      await prisma.financialAccount.create({ data: acc });
    }
  }
  console.log('✅ Contas Financeiras semeadas.');

  console.log('✨ Seed financeiro concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
