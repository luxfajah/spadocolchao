import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categoriesToClear = [
    'Colchão novo',
    'Reforma de colchão',
    'Reforma de box',
    'Box Novo',
    'Box novo' // Case sensitivity check
  ];

  console.log('Iniciando limpeza de produtos...');

  // Deletar produtos das categorias especificadas
  const deleteResult = await prisma.productService.deleteMany({
    where: {
      operationalCategory: {
        in: categoriesToClear
      }
    }
  });

  console.log(`${deleteResult.count} produtos removidos.`);

  const productsToCreate = [
    // Categoria: Reforma de colchão
    { name: 'reforma de colchão', category: 'Reforma de colchão' },
    { name: 'reforma colchão Hotelaria', category: 'Reforma de colchão' },
    { name: 'reforma colchão personalizado', category: 'Reforma de colchão' },

    // Categoria: Colchão novo
    { name: 'colchão novo', category: 'Colchão novo' },
    { name: 'colchão novo Hotelaria', category: 'Colchão novo' },
    { name: 'Colchão novo Personalizado', category: 'Colchão novo' },

    // Categoria: Reforma de Box
    { name: 'reforma de Box', category: 'Reforma de box' },
    { name: 'reforma de box hotelaria', category: 'Reforma de box' },
    { name: 'reforma de box personalizado', category: 'Reforma de box' },

    // Categoria: Box Novo
    { name: 'Box Novo', category: 'Box Novo' },
    { name: 'Box novo Hotelaria', category: 'Box Novo' },
    { name: 'box novo personalizado', category: 'Box Novo' },
  ];

  console.log('Criando novos produtos...');

  for (const p of productsToCreate) {
    await prisma.productService.create({
      data: {
        name: p.name,
        operationalCategory: p.category,
        type: 'SERVICE',
        isActive: true,
        highlightInPDV: true,
        catalogOrder: 0,
        defaultPrice: 0, // Vendedores definem no PDV via wizard
      }
    });
    console.log(`  - Criado: ${p.name} em ${p.category}`);
  }

  console.log('Operação concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante a execução do script:');
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
