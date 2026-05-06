import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const data = {
  "ADMINISTRATIVO": {
    "Estrutura": [
      "aluguel", "condomínio", "IPTU", "energia elétrica", "água", "internet", "telefone fixo", 
      "limpeza", "copa/cozinha", "material escritório", "mobiliário", "manutenção predial", 
      "dedetização", "segurança", "monitoramento", "alarme", "câmeras", "estacionamento", "cartório"
    ],
    "Financeiro": [
      "taxas bancárias", "tarifas PIX", "tarifas boleto", "taxas cartão", "antecipação recebíveis", 
      "juros", "multas", "IOF", "conciliação financeira", "consultoria financeira"
    ],
    "Contábil e Jurídico": [
      "contador", "assessoria contábil", "assessoria jurídica", "contratos", "registro marca", 
      "INPI", "certificado digital", "licenças", "alvarás", "honorários advocatícios"
    ],
    "RH": [
      "salários administrativos", "pró-labore", "férias", "13º", "FGTS", "INSS patronal", 
      "VT", "VR", "plano saúde", "benefícios", "recrutamento", "treinamentos", 
      "exames admissionais", "exames periódicos"
    ],
    "Impostos": [
      "Simples Nacional", "DAS", "ISS", "ICMS", "PIS", "COFINS", "IRPJ", "CSLL"
    ]
  },
  "COMERCIAL": {
    "Atendimento": [
      "WhatsApp Business", "telefonia móvel", "CRM", "chatbot", "automação atendimento", "e-mail comercial"
    ],
    "Equipe Comercial": [
      "salários vendedores", "comissão vendas", "bônus", "SDR", "closer", "representantes", 
      "ajuda custo", "combustível visitas"
    ],
    "Operação Comercial": [
      "propostas", "catálogos", "folders", "brindes", "feiras", "networking", "coffee reuniões", "eventos comerciais"
    ],
    "Pós-venda": [
      "suporte cliente", "trocas comerciais", "garantia comercial", "cashback", "pesquisas satisfação", "fidelização"
    ]
  },
  "LOGÍSTICA": {
    "Veículos": [
      "combustível", "diesel", "manutenção preventiva", "manutenção corretiva", "pneus", 
      "alinhamento", "balanceamento", "óleo", "lavagem", "seguro", "IPVA", "licenciamento"
    ],
    "Operação": [
      "coleta", "entrega", "ajudantes", "fretes terceiros", "transportadoras", "pedágios", 
      "estacionamento", "embalagem transporte", "rastreamento"
    ],
    "Gestão Logística": [
      "roteirização", "sistema logística", "aluguel veículos", "locação utilitários", "monitoramento frota"
    ]
  },
  "MARKETING": {
    "Tráfego Pago": [
      "Meta Ads", "Google Ads", "TikTok Ads", "impulsionamento", "remarketing"
    ],
    "Branding": [
      "identidade visual", "rebranding", "brandbook", "direção criativa", "consultoria branding"
    ],
    "Conteúdo": [
      "designer", "social media", "videomaker", "fotógrafo", "edição vídeo", "copywriting", 
      "motion design", "UGC creators"
    ],
    "Estrutura Digital": [
      "hospedagem", "domínio", "e-mail marketing", "landing pages", "analytics", "SEO", "automações"
    ],
    "Materiais Físicos": [
      "banners", "fachada", "adesivos", "papelaria", "cartões visita", "uniformes branding", "brindes"
    ]
  },
  "PRODUÇÃO": {
    "Espumas e Estruturas": [
      "espuma D23", "espuma D28", "espuma D33", "espuma HR", "espuma visco", "espuma reciclada", 
      "molas", "madeira", "compensado", "MDF"
    ],
    "Tecidos e Acabamentos": [
      "tecido tampo", "tecido lateral", "malha", "jacquard", "suede", "TNT", "manta", 
      "fibra siliconada", "viés", "vivo", "etiquetas", "bordados"
    ],
    "Insumos Operacionais": [
      "cola", "spray cola", "grampos", "linha", "zíper", "velcro", "plástico embalagem", 
      "sacos embalagem", "impermeabilizantes", "produtos limpeza"
    ],
    "Operação Produção": [
      "manutenção máquinas", "peças máquinas", "ferramentas", "lubrificantes", "EPIs", 
      "uniformes", "descarte resíduos", "afiação"
    ],
    "Equipe Produção": [
      "salários produção", "comissão produção", "horas extras", "bonificações"
    ],
    "Qualidade": [
      "inspeção", "retrabalho", "devoluções", "garantia técnica", "assistência técnica"
    ]
  },
  "TECNOLOGIA": {
    "Sistemas": [
      "ERP", "CRM", "APIs", "servidores", "Vercel", "Supabase", "banco dados", "automações"
    ],
    "Desenvolvimento": [
      "programadores", "freelancers", "UI/UX", "manutenção sistema", "testes", "documentação técnica"
    ],
    "Infraestrutura": [
      "notebooks", "computadores", "celulares", "monitores", "impressoras", "periféricos", "licenças software"
    ],
    "IA e Automação": [
      "OpenAI", "Claude", "OCR", "automações IA", "integrações", "workflows"
    ]
  }
};

function generateSlug(text: string) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log('Iniciando cadastro de categorias...');

  for (const [costCenterName, subcategories] of Object.entries(data)) {
    console.log(`Processando Centro de Custo: ${costCenterName}`);
    
    // Create or find the Cost Center
    const ccCode = `CC-${generateSlug(costCenterName).toUpperCase()}`;
    const costCenter = await prisma.costCenter.upsert({
      where: { code: ccCode },
      update: { name: costCenterName },
      create: {
        code: ccCode,
        name: costCenterName,
        description: `Centro de Custo ${costCenterName}`
      }
    });

    for (const [subGroupName, items] of Object.entries(subcategories)) {
      for (const item of items) {
        const itemName = typeof item === 'string' ? item : item;
        // Capitalize the first letter
        const formattedName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
        
        const catCode = `CAT-${generateSlug(costCenterName).substring(0,3).toUpperCase()}-${generateSlug(itemName).toUpperCase()}`;
        
        console.log(`  - Categoria: ${formattedName} [${catCode}]`);
        
        await prisma.financialCategory.upsert({
          where: { code: catCode },
          update: {
            name: formattedName,
            description: subGroupName,
            costCenters: {
              connect: { id: costCenter.id }
            }
          },
          create: {
            code: catCode,
            name: formattedName,
            type: "EXPENSE",
            description: subGroupName,
            costCenters: {
              connect: { id: costCenter.id }
            }
          }
        });
      }
    }
  }

  console.log('Cadastro concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
