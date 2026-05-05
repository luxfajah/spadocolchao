import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const imageMap = {
  foam: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\foam_reference_1774573233147.png',
  wood: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\wood_reference_1774573246813.png',
  fabric_top: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\fabric_top_reference_1774573260096.png',
  fabric_side: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\fabric_side_reference_1774573275412.png',
  fabric_box: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\fabric_box_reference_1774573292867.png',
  springs: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\springs_reference_1774573305139.png',
  therapy_kit: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\therapy_kit_reference_1774573319419.png',
  threads: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\threads_reference_1774573333347.png',
  staples: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\staples_reference_1774573351103.png',
  thinner: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\thinner_reference_1774573366199.png',
  glue: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\glue_reference_1774573380614.png',
  packaging: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\packaging_reference_1774573394706.png',
  corner: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\corner_reference_1774573412492.png',
  tnt: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\tnt_reference_1774573427678.png',
  feet: 'C:\\Users\\luxpi\\.gemini\\antigravity\\brain\\3cc1d9d3-de4b-4de9-9c4d-18d9ba46222d\\feet_reference_1774573440134.png'
};

const publicDir = path.join(__dirname, 'public', 'insumos');

for (const [key, source] of Object.entries(imageMap)) {
  const target = path.join(publicDir, `${key}.png`);
  try {
     fs.copyFileSync(source, target);
     console.log(`Copied ${key}.png`);
  } catch(e) {
     console.error(`Failed to copy ${source} to ${target}: ${e.message}`);
  }
}

async function main() {
  
  // 1. Ensure categories exist
  const catNames = [
    "Acessórios e Fixação",
    "Químicos e Colas",
    "Embalagens e Proteção",
    "Componentes para Box"
  ];
  const cats = {};
  for (const name of catNames) {
    cats[name] = await prisma.supplyCategory.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // Also get existing categories
  const allCats = await prisma.supplyCategory.findMany();
  for (const c of allCats) {
    cats[c.name] = c;
  }

  const suppliers = await prisma.supplier.findMany();
  let defaultSupplierId = suppliers.length > 0 ? suppliers[0].id : null;
  if (!defaultSupplierId) {
    const defaultSup = await prisma.supplier.create({
      data: {
        legalName: "Fornecedor Padrão ERP",
        personType: "COMPANY",
        code: "FORN-PADRAO-01"
      }
    });
    defaultSupplierId = defaultSup.id;
  }

  // 2. Define standard items to add (if not exist)
  const itemsToAdd = [
    { name: "Grampos Pneumáticos 80/10 (Caixa 10.000)", cat: "Acessórios e Fixação", unit: "CX", img: "/insumos/staples.png" },
    { name: "Cola Spray Especial para Estofamento 20L", cat: "Químicos e Colas", unit: "Lata", img: "/insumos/glue.png" },
    { name: "Thinner para Limpeza 5L", cat: "Químicos e Colas", unit: "Lata", img: "/insumos/thinner.png" },
    { name: "Plástico Transparente para Embalagem (Rolo)", cat: "Embalagens e Proteção", unit: "Rolo", img: "/insumos/packaging.png" },
    { name: "Cantoneira de Papelão (Pacote 100un)", cat: "Embalagens e Proteção", unit: "PCT", img: "/insumos/corner.png" },
    { name: "Tecido TNT Preto 100g (Rolo)", cat: "Componentes para Box", unit: "Rolo", img: "/insumos/tnt.png" },
    { name: "Pezinho de Madeira 12cm (Kit 7un)", cat: "Componentes para Box", unit: "Kit", img: "/insumos/feet.png" },
    { name: "Tecido para Box Suede Preto", cat: "Tecidos e Revestimentos", unit: "Metra", img: "/insumos/fabric_box.png" },
    { name: "Tecido para Box Corino Cinza", cat: "Tecidos e Revestimentos", unit: "Metro", img: "/insumos/fabric_box.png" },
    { name: "Tecido para Box Corino Marrom", cat: "Tecidos e Revestimentos", unit: "Metro", img: "/insumos/fabric_box.png" }
  ];

  for(const item of itemsToAdd) {
    const existing = await prisma.supplyItem.findFirst({ where: { name: item.name } });
    if (!existing) {
       await prisma.supplyItem.create({
         data: {
           name: item.name,
           unit: item.unit,
           categoryId: cats[item.cat]?.id,
           primarySupplierId: defaultSupplierId,
           imageUrl: item.img,
           currentStock: 10,
           averageCost: 50.00
         }
       });
       console.log(`Created: ${item.name}`);
    } else {
       await prisma.supplyItem.update({
         where: { id: existing.id },
         data: { imageUrl: item.img }
       });
       console.log(`Updated image for: ${item.name}`);
    }
  }

  // 3. Update existing items to have an image
  const existingItems = await prisma.supplyItem.findMany();
  for (const item of existingItems) {
    if (item.imageUrl) continue; // skip if already has image

    let img = "/insumos/foam.png"; // default
    const lname = item.name.toLowerCase();
    
    // basic string matching
    if (lname.includes('espuma')) img = "/insumos/foam.png";
    else if (lname.includes('mdf') || lname.includes('sarrafo') || lname.includes('madeira')) img = "/insumos/wood.png";
    else if (lname.includes('tampo') || lname.includes('jacquard') || lname.includes('malha')) img = "/insumos/fabric_top.png";
    else if (lname.includes('suede') || lname.includes('linho') || lname.includes('corino')) img = "/insumos/fabric_side.png";
    else if (lname.includes('molejo') || lname.includes('mola')) img = "/insumos/springs.png";
    else if (lname.includes('massageador') || lname.includes('pastilha') || lname.includes('kit') || lname.includes('infra/')) img = "/insumos/therapy_kit.png";
    else if (lname.includes('fita de borda') || lname.includes('linha')) img = "/insumos/threads.png";
    
    await prisma.supplyItem.update({
      where: { id: item.id },
      data: { imageUrl: img }
    });
    console.log(`Assigned ${img} to ${item.name}`);
  }

  console.log("Done updating images!");
}

main().finally(() => prisma.$disconnect());
