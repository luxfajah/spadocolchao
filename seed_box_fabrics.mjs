import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  
  // Ensure "Tecidos e Revestimentos" category exists
  let catTecidos = await prisma.supplyCategory.findUnique({ where: { name: "Tecidos e Revestimentos" } });
  if (!catTecidos) {
    catTecidos = await prisma.supplyCategory.create({ data: { name: "Tecidos e Revestimentos" } });
  }

  // Ensure "Componentes para Box" category exists
  let catBox = await prisma.supplyCategory.findUnique({ where: { name: "Componentes para Box" } });
  if (!catBox) {
    catBox = await prisma.supplyCategory.create({ data: { name: "Componentes para Box" } });
  }

  // Get a default supplier
  const suppliers = await prisma.supplier.findMany();
  const defaultSupplierId = suppliers.length > 0 ? suppliers[0].id : null;

  const boxFabrics = [
    // Topo do Box (TNT Grosso)
    { name: "TNT Grosso Gramatura 150g para Tampo de Box", catId: catBox.id, unit: "Rolo", img: "/insumos/tnt.png", cost: 80.0 },
    { name: "TNT Gramatura 120g Antiderrapante para Tampo de Box", catId: catBox.id, unit: "Rolo", img: "/insumos/tnt.png", cost: 110.0 },
    
    // Variedade de Suede Liso (Laterais)
    { name: "Suede Liso Box Marrom Café", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 15.0 },
    { name: "Suede Liso Box Preto", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 15.0 },
    { name: "Suede Liso Box Cinza Chumbo", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 15.0 },
    { name: "Suede Liso Box Bege Areia", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 15.0 },

    // Variedade de Suede Amassado
    { name: "Suede Amassado Box Preto", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 18.0 },
    { name: "Suede Amassado Box Tabaco", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 18.0 },
    { name: "Suede Amassado Box Prata", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 18.0 },

    // Variedade de Corino (Sintético)
    { name: "Corino Sintético Impermeável Preto", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 22.0 },
    { name: "Corino Sintético Impermeável Marrom", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 22.0 },
    { name: "Corino Sintético Impermeável Cinza", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 22.0 },
    { name: "Corino Sintético Impermeável Branco", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 22.0 },

    // Variedade de Linho Sintético Rústico
    { name: "Linho Sintético Rústico Box Bege Quente", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 28.0 },
    { name: "Linho Sintético Rústico Box Cinza Claro", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 28.0 },
    { name: "Linho Sintético Rústico Box Chumbo", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 28.0 },
    
    // Matelassê para Box
    { name: "Matelassê Duplo Costurado para Box Preto", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 35.0 },
    { name: "Matelassê Duplo Costurado para Box Bege", catId: catTecidos.id, unit: "Metro", img: "/insumos/fabric_box.png", cost: 35.0 },
  ];

  for (const item of boxFabrics) {
    const existing = await prisma.supplyItem.findFirst({ where: { name: item.name } });
    if (!existing) {
       await prisma.supplyItem.create({
         data: {
           name: item.name,
           unit: item.unit,
           categoryId: item.catId,
           primarySupplierId: defaultSupplierId,
           imageUrl: item.img,
           currentStock: 25,
           averageCost: item.cost
         }
       });
       console.log(`Created: ${item.name}`);
    } else {
       await prisma.supplyItem.update({
         where: { id: existing.id },
         data: { 
            imageUrl: item.img,
            unit: item.unit
         }
       });
       console.log(`Updated existing: ${item.name}`);
    }
  }

  console.log("Done adding Box Fabrics!");
}

main().finally(() => prisma.$disconnect());
