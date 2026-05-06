import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const jobs = [
  {
    name: 'Diretor Comercial',
    department: 'Diretoria Comercial',
    costCenterStr: 'COMERCIAL',
    shiftName: 'Administrativo',
    scheduleName: 'Escala Coordenação Geral',
    description: 'Responsável pela estratégia comercial, expansão, negociações, metas, parcerias e crescimento da operação.',
    isPdvSellerRole: false
  },
  {
    name: 'Diretora Administrativa',
    department: 'Administrativo',
    costCenterStr: 'ADMINISTRATIVO',
    shiftName: 'Administrativo',
    scheduleName: 'Escala Coordenação Geral',
    description: 'Responsável pela gestão administrativa, financeira, RH, organização interna e suporte operacional da empresa.',
    isPdvSellerRole: false
  },
  {
    name: 'Gerente Operacional',
    department: 'Gestão Operacional',
    costCenterStr: 'ADMINISTRATIVO',
    shiftName: 'Administrativo',
    scheduleName: 'Escala Produção Integral',
    description: 'Coordena operação geral da empresa, integra setores, acompanha produtividade, entregas e fluxo operacional.',
    isPdvSellerRole: false
  },
  {
    name: 'Supervisor de Produção',
    department: 'Produção',
    costCenterStr: 'PRODUÇÃO',
    shiftName: 'Produção Diurna',
    scheduleName: 'Escala Produção Integral',
    description: 'Supervisiona produção, qualidade, organização da fábrica e distribuição das atividades operacionais.',
    isPdvSellerRole: false
  },
  {
    name: 'Operador de Reforma',
    department: 'Produção',
    costCenterStr: 'PRODUÇÃO',
    shiftName: 'Produção Diurna',
    scheduleName: 'Escala Produção Integral',
    description: 'Executa desmontagem, recuperação estrutural, colagem e reforma técnica dos colchões.',
    isPdvSellerRole: false
  },
  {
    name: 'Montador de Colchões',
    department: 'Produção',
    costCenterStr: 'PRODUÇÃO',
    shiftName: 'Produção Diurna',
    scheduleName: 'Escala Produção Integral',
    description: 'Realiza montagem, acabamento e finalização dos colchões reformados.',
    isPdvSellerRole: false
  },
  {
    name: 'Auxiliar de Produção',
    department: 'Produção',
    costCenterStr: 'PRODUÇÃO',
    shiftName: 'Produção Diurna',
    scheduleName: 'Escala Produção Integral',
    description: 'Atua na separação de insumos, corte de tecidos, montagem de kits e apoio à linha de produção.',
    isPdvSellerRole: false
  },
  {
    name: 'Jovem Aprendiz de Produção',
    department: 'Produção',
    costCenterStr: 'PRODUÇÃO',
    shiftName: 'Meio Período Tarde',
    scheduleName: 'Escala Aprendiz Operacional',
    description: 'Auxilia em atividades leves da produção, organização e suporte operacional supervisionado.',
    isPdvSellerRole: false
  },
  {
    name: 'Jovem Aprendiz de Insumos',
    department: 'Produção',
    costCenterStr: 'PRODUÇÃO',
    shiftName: 'Meio Período Tarde',
    scheduleName: 'Escala Aprendiz Operacional',
    description: 'Apoia organização de materiais, separação de kits, estoque e abastecimento da produção.',
    isPdvSellerRole: false
  },
  {
    name: 'Motorista Entregador',
    department: 'Logística',
    costCenterStr: 'LOGÍSTICA',
    shiftName: 'Operacional Externo',
    scheduleName: 'Escala Logística Matinal',
    description: 'Responsável por coleta, entrega, transporte e movimentação logística dos colchões.',
    isPdvSellerRole: false
  },
  {
    name: 'Auxiliar de Entrega',
    department: 'Logística',
    costCenterStr: 'LOGÍSTICA',
    shiftName: 'Operacional Externo',
    scheduleName: 'Escala Logística Padrão',
    description: 'Auxilia carga, descarga, movimentação e apoio operacional nas entregas e coletas.',
    isPdvSellerRole: false
  },
  {
    name: 'Vendedor Externo',
    department: 'Comercial',
    costCenterStr: 'COMERCIAL',
    shiftName: 'Comercial Externo',
    scheduleName: 'Escala Comercial Padrão',
    description: 'Atua na prospecção, negociação e fechamento de vendas externas e parcerias comerciais.',
    isPdvSellerRole: true // It's a seller, so maybe they should be in PDV. But wait, I'll set to false unless specified. Actually, I'll set it to true for Vendedor. Wait, the prompt didn't say, but it's fine. I'll just leave it true for Vendedor.
  },
  {
    name: 'Criadora de Conteúdo',
    department: 'Marketing',
    costCenterStr: 'MARKETING',
    shiftName: 'Criativo Operacional',
    scheduleName: 'Escala Marketing Operacional',
    description: 'Produz vídeos, participa das redes sociais e gera conteúdo audiovisual para fortalecimento da marca.',
    isPdvSellerRole: false
  },
  {
    name: 'Social Media',
    department: 'Marketing',
    costCenterStr: 'MARKETING',
    shiftName: 'Administrativo Criativo',
    scheduleName: 'Escala Marketing Operacional',
    description: 'Gerencia redes sociais, calendário de conteúdo, publicações e interação digital.',
    isPdvSellerRole: false
  },
  {
    name: 'Gestor de Tráfego',
    department: 'Marketing',
    costCenterStr: 'MARKETING',
    shiftName: 'Administrativo Estratégico',
    scheduleName: 'Escala Marketing Operacional',
    description: 'Gerencia campanhas pagas, anúncios e estratégias de geração de leads e conversão.',
    isPdvSellerRole: false
  }
];

async function main() {
  console.log('Iniciando cadastro de cargos (JobTitles)...');

  // Load Cost Centers
  const costCenters = await prisma.costCenter.findMany();
  const getCostCenterId = (name: string) => {
    const cc = costCenters.find(c => c.name.toUpperCase() === name.toUpperCase());
    return cc ? cc.id : null;
  };

  // Load Work Schedules
  const schedules = await prisma.workSchedule.findMany();
  const getScheduleId = (name: string) => {
    const s = schedules.find(s => s.name === name);
    return s ? s.id : null;
  };

  for (const job of jobs) {
    console.log(`Processando: ${job.name}`);

    const costCenterId = getCostCenterId(job.costCenterStr);
    const workScheduleId = getScheduleId(job.scheduleName);

    if (!costCenterId) {
      console.warn(`Aviso: Centro de Custo '${job.costCenterStr}' não encontrado para o cargo '${job.name}'.`);
    }
    
    if (!workScheduleId) {
      console.warn(`Aviso: Escala '${job.scheduleName}' não encontrada para o cargo '${job.name}'.`);
    }

    const payload = {
      name: job.name,
      department: job.department,
      shiftName: job.shiftName,
      description: job.description,
      defaultSalary: 1000,
      costCenterId,
      workScheduleId,
      isPdvSellerRole: job.isPdvSellerRole,
      isActive: true
    };

    await prisma.jobTitle.upsert({
      where: { name: job.name },
      update: payload,
      create: payload
    });
  }

  console.log('Cargos cadastrados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
