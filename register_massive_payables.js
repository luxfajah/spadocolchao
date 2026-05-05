const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const goalTarget = 503998.08;
  const entriesCount = 69;

  const categories = ['Produção', 'Administrativo', 'Vendas', 'Logística', 'Marketing'];
  const statusOptions = ['PAID', 'PENDING'];
  
  // Big items (8 items)
  let currentTotal = 0;
  const items = [
    { desc: 'Aluguel Galpão Industrial - Março/26', amount: 45000, cat: 'Administrativo', status: 'PAID', due: 5 },
    { desc: 'Folha de Pagamento - Competência 02/2026', amount: 68000, cat: 'Administrativo', status: 'PAID', due: 5 },
    { desc: 'Insumos Espumas - NF 8821', amount: 115000, cat: 'Produção', status: 'PAID', supplier: 'Sogno Espumas', due: 7 },
    { desc: 'Insumos Madeira - NF 4432', amount: 80000, cat: 'Produção', status: 'PAID', supplier: 'Reflorestal Madeiras', due: 12 },
    { desc: 'Insumos Tecidos - NF 9011', amount: 88000, cat: 'Produção', status: 'PENDING', supplier: 'TexSul', due: 31 },
    { desc: 'Impostos Federais (DAS)', amount: 15248.08, cat: 'Administrativo', status: 'PENDING', due: 20 },
    { desc: 'Energia Elétrica Copel', amount: 12450, cat: 'Produção', status: 'PAID', due: 15 },
    { desc: 'Marketing Digital - Google/FB Ads', amount: 22000, cat: 'Marketing', status: 'PAID', due: 10 }
  ];

  items.forEach(i => currentTotal += i.amount);

  // Generate 61 more items to reach 69
  const smallItemDescriptions = [
    { desc: 'Uber Emergência RH - Entrevista', cat: 'Administrativo', supplier: 'Uber' },
    { desc: 'Papelaria - Clips e Grampos', cat: 'Administrativo', supplier: 'Papelaria Central' },
    { desc: 'Manutenção PC Recepção', cat: 'Administrativo', supplier: 'TechAssist' },
    { desc: 'Café e Açúcar - Copa', cat: 'Administrativo', supplier: 'Supermercado Local' },
    { desc: 'Material de Limpeza - Escritório', cat: 'Administrativo', supplier: 'Supermercado Local' },
    { desc: 'Manutenção Ar Condicionado', cat: 'Administrativo', supplier: 'TechAssist' },
    { desc: 'Uber - Entrega Documento Contábil', cat: 'Administrativo', supplier: 'Uber' },
    { desc: 'Papelaria - Papel A4 Resmas', cat: 'Administrativo', supplier: 'Papelaria Central' },
    { desc: 'Toner Impressora Financeiro', cat: 'Administrativo', supplier: 'Papelaria Central' },
    { desc: 'Lavagem de Veículo Logística', cat: 'Logística' },
    { desc: 'Combustível - Pick-up Entrega', cat: 'Logística' },
    { desc: 'Lanche Reunião de Vendas', cat: 'Vendas', supplier: 'Supermercado Local' },
    { desc: 'Manutenção Telefone Recepção', cat: 'Administrativo', supplier: 'TechAssist' },
    { desc: 'Pilhas para Controles e Mouses', cat: 'Administrativo', supplier: 'Papelaria Central' },
    { desc: 'Garrafão de Água Mineral', cat: 'Administrativo', supplier: 'Supermercado Local' },
    { desc: 'Reposição Lâmpadas LED Galpão', cat: 'Produção' },
    { desc: 'Fita Crepe Embalagem', cat: 'Produção', supplier: 'Papelaria Central' },
    { desc: 'Chaveiro Emergência - Portão', cat: 'Administrativo' },
    { desc: 'Aviso de Recebimento (Correios)', cat: 'Administrativo' },
    { desc: 'Assinatura Software Gestão', cat: 'Administrativo' }
  ];

  const remainingToDistribute = goalTarget - currentTotal;
  const avgSmall = remainingToDistribute / (entriesCount - items.length);

  for (let i = items.length; i < entriesCount; i++) {
    const template = smallItemDescriptions[i % smallItemDescriptions.length];
    // Randomize amount slightly around average
    let amount = avgSmall * (0.5 + Math.random());
    
    if (i === entriesCount - 1) {
      // Last item adjust to exact total
      amount = goalTarget - currentTotal;
    }

    items.push({
      desc: `${template.desc} #${i - items.length + 1}`,
      amount: parseFloat(amount.toFixed(2)),
      cat: template.cat,
      status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
      supplier: template.supplier,
      due: Math.floor(Math.random() * 28) + 1
    });

    currentTotal += amount;
    // Accuracy check for last item
    if (i === entriesCount - 1) {
       const diff = goalTarget - currentTotal;
       items[items.length - 1].amount += diff;
    }
  }

  // Registering logic
  console.log('Generating suppliers...');
  // (Supplier logic from previous script...)
  const suppliersData = [
    { name: 'Uber', tradeName: 'Uber Technologies', doc: '00.000.000/0001-00' },
    { name: 'Papelaria Central', tradeName: 'Papelaria Central Ltda', doc: '11.111.111/0001-11' },
    { name: 'TechAssist', tradeName: 'TechAssist Manutenção ME', doc: '22.222.222/0001-22' },
    { name: 'Supermercado Local', tradeName: 'Supermercado Local S/A', doc: '33.333.333/0001-33' }
  ];

  const supplierMap = {};
  for (const s of suppliersData) {
    let supplier = await prisma.supplier.findFirst({ where: { legalName: s.name } });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { legalName: s.name, tradeName: s.tradeName, document: s.doc, isActive: true }
      });
    }
    supplierMap[s.name] = supplier.id;
  }

  const existingSupps = await prisma.supplier.findMany({
    where: { legalName: { in: ['Sogno Espumas e Polímeros S/A', 'Madeireira Reflorestal Brasil Ltda', 'TexSul Tecidos e Malhas Premium', 'AçoFlex Arame e Molejos Indústria'] } }
  });
  existingSupps.forEach(s => {
    if (s.legalName.includes('Sogno')) supplierMap['Sogno Espumas'] = s.id;
    if (s.legalName.includes('Madeireira')) supplierMap['Reflorestal Madeiras'] = s.id;
    if (s.legalName.includes('TexSul')) supplierMap['TexSul'] = s.id;
    if (s.legalName.includes('AçoFlex')) supplierMap['AçoFlex'] = s.id;
  });

  const dbCats = await prisma.financialCategory.findMany();
  const dbCCs = await prisma.costCenter.findMany();

  console.log(`Inserting ${items.length} records...`);
  let successCount = 0;
  for (const item of items) {
    const catId = dbCats.find(c => c.name === item.cat)?.id;
    const ccId = dbCCs.find(cc => cc.name === item.cat)?.id; // Assuming same naming

    await prisma.accountPayable.create({
      data: {
        description: item.desc,
        amount: item.amount,
        dueDate: new Date(2026, 2, item.due),
        issueDate: new Date(2026, 2, 1),
        status: item.status,
        paidAmount: item.status === 'PAID' ? item.amount : 0,
        paymentDate: item.status === 'PAID' ? new Date(2026, 2, item.due) : null,
        financialCategoryId: catId,
        costCenterId: ccId,
        supplierId: item.supplier ? supplierMap[item.supplier] : null,
        notes: 'Simulação Massiva - 48% da meta'
      }
    });
    successCount++;
  }

  console.log(`Total items inserted: ${successCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
