import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from "crypto"

const prisma = new PrismaClient()

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${hash}`
}

async function main() {
  console.log('Iniciando seed de demonstração com o novo schema conectando todos os módulos...')

  // 1. Configurações e Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {},
    create: {
      name: 'Administrador',
      description: 'Administrador do sistema',
      isSystem: true,
      status: 'ACTIVE',
    },
  })

  // 2. Criar Usuário Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@spadocolchao.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@spadocolchao.com',
      username: 'admin',
      passwordHash: 'admin', // Em produção use bcrypt/hash
      status: 'ACTIVE',
      isSuperAdmin: true,
    },
  })

  // Vincular Usuário ao Role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  // 3. Origens de Lead
  const leadSources = [
    { code: 'ADS', name: 'Tráfego pago', category: 'Digital paga', description: 'Google Ads, Meta Ads', isActive: true, requiresDetail: true },
    { code: 'INSTA_ORG', name: 'Instagram orgânico', category: 'Digital orgânica', description: 'Direct, Link na Bio', isActive: true },
    { code: 'LOJA', name: 'Porta de loja', category: 'Loja física', description: 'Cliente entrou na loja física', isActive: true, isDefaultPdv: true, priority: 10 },
    { code: 'IND_CLI', name: 'Indicação de cliente', category: 'Indicação', description: 'Cliente indicado por outro', isActive: true, requiresDetail: true },
    { code: 'PROM', name: 'Promoções diversas', category: 'Campanha', description: 'Campanhas sazonais', isActive: true, requiresDetail: true },
    { code: 'V_EXT', name: 'Venda externa', category: 'Externa', description: 'Venda fora da loja', isActive: true, requiresDetail: true },
    { code: 'RECORR', name: 'Cliente recorrente', category: 'Reativação', description: 'Cliente que já comprou antes', isActive: true },
    { code: 'GOOGLE', name: 'Google', category: 'Digital orgânica', description: 'Busca orgânica no Google', isActive: true },
    { code: 'WPP', name: 'WhatsApp', category: 'Digital orgânica', description: 'Contato via WhatsApp', isActive: true },
    { code: 'PART', name: 'Parceria', category: 'Parceria', description: 'Parcerias comerciais', isActive: true, requiresDetail: true },
    { code: 'FEIRA', name: 'Feira / evento', category: 'Campanha', description: 'Captado em eventos', isActive: true },
    { code: 'REAT', name: 'Reativação de cliente', category: 'Reativação', description: 'Campanha de reativação', isActive: true },
    { code: 'FB_ORG', name: 'Facebook orgânico', category: 'Digital orgânica', description: 'Postagens orgânicas FB', isActive: true },
    { code: 'SITE', name: 'Site', category: 'Digital orgânica', description: 'Formulário do site', isActive: true },
    { code: 'OUTRO', name: 'Outro', category: 'Outro', description: 'Outras origens', isActive: true }
  ];

  for (const ls of leadSources) {
    await prisma.leadSource.upsert({
      where: { code: ls.code },
      update: { 
        name: ls.name,
        category: ls.category,
        description: ls.description,
        isActive: ls.isActive,
        requiresDetail: ls.requiresDetail || false,
        isDefaultPdv: ls.isDefaultPdv || false,
        priority: ls.priority || 0
      },
      create: { 
        code: ls.code, 
        name: ls.name, 
        category: ls.category,
        description: ls.description, 
        isActive: ls.isActive,
        requiresDetail: ls.requiresDetail || false,
        isDefaultPdv: ls.isDefaultPdv || false,
        priority: ls.priority || 0
      }
    });
  }

  // 4. Métodos de Pagamento
  await prisma.paymentMethod.upsert({
    where: { code: 'PIX' },
    update: {},
    create: { code: 'PIX', name: 'PIX', type: 'PIX', isActive: true }
  })
  
  await prisma.paymentMethod.upsert({
    where: { code: 'CREDITO' },
    update: {},
    create: { code: 'CREDITO', name: 'Cartão de Crédito', type: 'CREDIT_CARD', allowsInstallments: true, maxInstallments: 12, isActive: true }
  })

  // 5. Clientes
  let customer = await prisma.customer.findFirst({ where: { document: '123.456.789-00' } })
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        personType: 'INDIVIDUAL',
        fullName: 'Cliente Exemplo Silva',
        document: '123.456.789-00',
        phone: '11999999999',
        isActive: true,
      }
    })
  }

  // 6. Vendedores
  let seller = await prisma.seller.findFirst({ where: { name: 'João Vendedor' } })
  if (!seller) {
    seller = await prisma.seller.create({
      data: {
        name: 'João Vendedor',
        type: 'INTERNAL',
        phone: '11988888888',
        defaultCommissionRate: 5.0,
        isActive: true,
      }
    })
  }

  // 7. Produtos / Serviços Iniciais
  await prisma.productService.upsert({
    where: { code: 'REF-CASAL' },
    update: {},
    create: {
      code: 'REF-CASAL',
      name: 'Reforma de Colchão Casal',
      type: 'SERVICE',
      description: 'Reconcidicionamento completo do colchão tamanho casal com troca de tecido',
      defaultPrice: 850.0,
      isActive: true,
    }
  })

  console.log('Seed finalizado com sucesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
