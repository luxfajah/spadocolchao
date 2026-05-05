const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = {
  ADMIN: "cmncmgmnr000ls51li24sib25",
  PROD: "cmncmgpez000ms51lfvpbv44g",
  VENDAS: "cmncmgpwp000ns51lvyhzpflg",
  LOGISTICA: "cmncmgqs4000os51lf3nti338",
  MARKETING: "cmnct1ao60000vjm90g82ajqk" // Marketing e Publicidade
};

const COST_CENTERS = {
  ADMIN: "cmnchh6xd0000124rges200qi",
  PROD: "cmnchh7hz0001124r7fhc4aqp",
  VENDAS: "cmnchh7qy0002124r81jjafil",
  LOGISTICA: "cmnchh8aq0003124rqdvycqkb",
  MARKETING: "cmnct5h0r002913tr26tg344v"
};

const RULES = [
  { keywords: ['Aluguel', 'Energia', 'Impostos', 'DAS', 'Software', 'Papelaria', 'Copa', 'RH', 'Contábil', 'Telefone', 'PC Reception', 'Água', 'Chaveiro', 'Limpeza', 'Escritório', 'A4', 'Clips', 'Grampos', 'Uber', 'Documento', 'Assinatura', 'Software'], cat: CATEGORIES.ADMIN, cc: COST_CENTERS.ADMIN },
  { keywords: ['Insumos', 'Espumas', 'Madeira', 'Galpão Industrial', 'Competência', 'Folha de Pagamento'], cat: CATEGORIES.PROD, cc: COST_CENTERS.PROD },
  { keywords: ['Vendas', 'Lanche Reunião'], cat: CATEGORIES.VENDAS, cc: COST_CENTERS.VENDAS },
  { keywords: ['Entrega', 'Logística', 'Combustível', 'Vehicle', 'Veículo', 'Lavagem', 'Embalagem', 'Fita Crepe', 'Correios', 'Lâmpadas', 'LED Galpão'], cat: CATEGORIES.LOGISTICA, cc: COST_CENTERS.LOGISTICA },
  { keywords: ['Ads', 'Marketing', 'Agência', 'RD Station', 'Meta', 'Google', 'Publicidade', 'Zapier'], cat: CATEGORIES.MARKETING, cc: COST_CENTERS.MARKETING }
];

async function main() {
  console.log("Iniciando Classificação Financeira - Março 2026...");

  const start = new Date('2026-03-01T00:00:00Z');
  const end = new Date('2026-03-31T23:59:59Z');

  const payables = await prisma.accountPayable.findMany({
    where: {
      dueDate: { gte: start, lte: end }
    },
    include: {
      paymentAllocations: {
        include: {
          transaction: true
        }
      }
    }
  });

  console.log(`Analisando ${payables.length} títulos...`);

  let updatedCount = 0;

  for (const title of payables) {
    let targetCat = null;
    let targetCC = null;

    for (const rule of RULES) {
      if (rule.keywords.some(k => title.description.toLowerCase().includes(k.toLowerCase()))) {
        targetCat = rule.cat;
        targetCC = rule.cc;
        break;
      }
    }

    if (targetCat) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Atualizar AccountPayable
          await tx.accountPayable.update({
            where: { id: title.id },
            data: {
              financialCategoryId: targetCat,
              costCenterId: targetCC
            }
          });

          // 2. Atualizar FinancialTransaction linked
          if (title.paymentAllocations && title.paymentAllocations.length > 0) {
            for (const allocation of title.paymentAllocations) {
              if (allocation.transaction) {
                await tx.financialTransaction.update({
                  where: { id: allocation.transaction.id },
                  data: {
                    financialCategoryId: targetCat
                  }
                });
              }
            }
          }
        });
        updatedCount++;
      } catch (error) {
        console.error(`Erro ao atualizar título ${title.id}:`, error.message);
      }
    }
  }

  console.log(`Classificação concluída!`);
  console.log(`Total de registros atualizados: ${updatedCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
