import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando registro de funcionários e ajuste de cargos para o PDV...');

  // 1. Garantir que os cargos tenham isPdvSellerRole = true
  const jobNamesToEnable = [
    'Vendedor Externo',
    'Gerente Operacional',
    'Diretor Comercial'
  ];

  for (const name of jobNamesToEnable) {
    await prisma.jobTitle.updateMany({
      where: { name },
      data: { isPdvSellerRole: true }
    });
    console.log(`Cargo '${name}' habilitado para o PDV.`);
  }

  // 2. Buscar IDs dos cargos
  const jobTitles = await prisma.jobTitle.findMany({
    where: { name: { in: jobNamesToEnable } }
  });

  const getJobId = (name: string) => jobTitles.find(jt => jt.name === name)?.id;

  // 3. Cadastrar Funcionários
  const employeesToRegister = [
    { fullName: 'Eduardo', jobTitleName: 'Vendedor Externo' },
    { fullName: 'Edgar', jobTitleName: 'Vendedor Externo' },
    { fullName: 'Anderson', jobTitleName: 'Gerente Operacional' },
    { fullName: 'Douglas', jobTitleName: 'Diretor Comercial' },
  ];

  for (const emp of employeesToRegister) {
    const jobId = getJobId(emp.jobTitleName);
    
    if (!jobId) {
      console.error(`Erro: Cargo '${emp.jobTitleName}' não encontrado para ${emp.fullName}`);
      continue;
    }

    const payload = {
      fullName: emp.fullName,
      status: 'ACTIVE',
      contractType: 'CLT',
      isActive: true,
      admissionDate: new Date(),
      jobTitleId: jobId,
    };

    // Usamos upsert baseado no fullName para simplificar (ajuste se precisar de outro critério único)
    const existing = await prisma.employee.findFirst({ where: { fullName: emp.fullName } });

    if (existing) {
       await prisma.employee.update({
         where: { id: existing.id },
         data: payload
       });
       console.log(`Funcionário '${emp.fullName}' atualizado.`);
    } else {
       await prisma.employee.create({
         data: payload
       });
       console.log(`Funcionário '${emp.fullName}' criado.`);
    }
  }

  console.log('Processo concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
