const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting accounts payable simulation...');

  // 1. Get or Create Suppliers
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
        data: {
          legalName: s.name,
          tradeName: s.tradeName,
          document: s.doc,
          isActive: true
        }
      });
      console.log(`Created supplier: ${s.name}`);
    }
    supplierMap[s.name] = supplier.id;
  }

  // Add existing suppliers to map
  const existingSuppliers = await prisma.supplier.findMany({
    where: {
      legalName: { in: ['Sogno Espumas e Polímeros S/A', 'Madeireira Reflorestal Brasil Ltda', 'TexSul Tecidos e Malhas Premium', 'AçoFlex Arame e Molejos Indústria'] }
    }
  });

  existingSuppliers.forEach(s => {
    if (s.legalName.includes('Sogno')) supplierMap['Sogno Espumas'] = s.id;
    if (s.legalName.includes('Madeireira')) supplierMap['Reflorestal Madeiras'] = s.id;
    if (s.legalName.includes('TexSul')) supplierMap['TexSul'] = s.id;
    if (s.legalName.includes('AçoFlex')) supplierMap['AçoFlex'] = s.id;
  });

  // 2. Define Payables
  const payables = [
    { desc: 'Insumos de Produção - Blocos de Espuma', amount: 115000.00, cat: 'Produção', cc: 'Produção', status: 'PAID', supplier: 'Sogno Espumas', due: '2026-03-05' },
    { desc: 'Insumos de Produção - Estruturas de Madeira', amount: 80000.00, cat: 'Produção', cc: 'Produção', status: 'PAID', supplier: 'Reflorestal Madeiras', due: '2026-03-10' },
    { desc: 'Insumos de Produção - Tecidos e Malhas', amount: 88000.00, cat: 'Produção', cc: 'Produção', status: 'PENDING', supplier: 'TexSul', due: '2026-03-31' },
    { desc: 'Aluguel do Galpão Industrial', amount: 45000.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', due: '2026-03-05' },
    { desc: 'Folha de Pagamento - Competência 02/2026', amount: 68000.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', due: '2026-03-05' },
    { desc: 'Energia Elétrica - Unidade Industrial', amount: 12450.00, cat: 'Produção', cc: 'Produção', status: 'PAID', due: '2026-03-15' },
    { desc: 'Manutenção de Maquinário', amount: 8500.00, cat: 'Produção', cc: 'Produção', status: 'PENDING', due: '2026-03-25' },
    { desc: 'Combustível e Manutenção de Frota', amount: 18300.00, cat: 'Logística', cc: 'Logística', status: 'PAID', due: '2026-03-20' },
    { desc: 'Campanha Facebook/Instagram Ads', amount: 22000.00, cat: 'Marketing', cc: 'Marketing', status: 'PAID', due: '2026-03-10' },
    { desc: 'Serviços de Terceiros - Limpeza e Segurança', amount: 7500.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', due: '2026-03-05' },
    { desc: 'Impostos (DAS Simples Nacional)', amount: 15248.08, cat: 'Administrativo', cc: 'Administrativo', status: 'PENDING', due: '2026-03-20' },
    { desc: 'Uber Emergência - Candidato Entrevista RH', amount: 45.50, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', supplier: 'Uber', due: '2026-03-12' },
    { desc: 'Papelaria RH - Folders e Contratos', amount: 350.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', supplier: 'Papelaria Central', due: '2026-03-14' },
    { desc: 'Manutenção PC Recepção - Formatação', amount: 250.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', supplier: 'TechAssist', due: '2026-03-15' },
    { desc: 'Café e Insumos Copa', amount: 1800.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', supplier: 'Supermercado Local', due: '2026-03-02' },
    { desc: 'Uber Emergência - Entrega Documento Contabil', amount: 32.50, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', supplier: 'Uber', due: '2026-03-18' },
    { desc: 'Manutenção Ar Condicionado Vendas', amount: 1200.00, cat: 'Vendas', cc: 'Vendas', status: 'PAID', supplier: 'TechAssist', due: '2026-03-20' },
    { desc: 'Papelaria RH - Crachás Novos', amount: 122.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PAID', supplier: 'Papelaria Central', due: '2026-03-22' },
    { desc: 'Reposição Cartuchos Toner', amount: 900.00, cat: 'Administrativo', cc: 'Administrativo', status: 'PENDING', supplier: 'Papelaria Central', due: '2026-03-28' },
    { desc: 'Insumos Diversos - Ferragens', amount: 19300.00, cat: 'Produção', cc: 'Produção', status: 'PAID', supplier: 'AçoFlex', due: '2026-03-12' }
  ];

  // 3. Get Category and Cost Center IDs
  const categories = await prisma.financialCategory.findMany();
  const costCenters = await prisma.costCenter.findMany();

  const getCatId = (name) => categories.find(c => c.name === name)?.id;
  const getCCId = (name) => costCenters.find(cc => cc.name === name)?.id;

  // 4. Insert Payables
  let count = 0;
  for (const p of payables) {
    await prisma.accountPayable.create({
      data: {
        description: p.desc,
        amount: p.amount,
        dueDate: new Date(p.due),
        issueDate: new Date(p.due), // Simplification: issue date same as due date for simulation
        status: p.status,
        paidAmount: p.status === 'PAID' ? p.amount : 0,
        paymentDate: p.status === 'PAID' ? new Date(p.due) : null,
        financialCategoryId: getCatId(p.cat),
        costCenterId: getCCId(p.cc),
        supplierId: p.supplier ? supplierMap[p.supplier] : null,
        notes: 'Simulação de operação real - 48% da meta'
      }
    });
    count++;
  }

  console.log(`Successfully registered ${count} accounts payable.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
