import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

// Simple CSV parser that handles quotes and newlines within quotes
function parseCSV(content: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

async function main() {
  const filePath = 'C:/Users/luxpi/Downloads/exportacao_clientes.csv';
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(fileContent);

  const header = rows[0];
  const dataRows = rows.slice(1);

  console.log(`Importando ${dataRows.length} clientes...`);

  const sellersMap = new Map<string, string>();

  for (const row of dataRows) {
    if (row.length < 2) continue;

    const [
      tipo, nome, razaoSocial, document, sexo, nascimento, 
      limite, situacao, prioridade, vendedor, observacao, 
      endereco, cep, cidade, uf, contatos
    ] = row;

    if (!nome) continue;

    // 1. Handle Seller
    let sellerId: string | null = null;
    if (vendedor) {
      if (sellersMap.has(vendedor)) {
        sellerId = sellersMap.get(vendedor)!;
      } else {
        let seller = await prisma.seller.findFirst({ where: { name: vendedor } });
        if (!seller) {
          seller = await prisma.seller.create({
            data: { name: vendedor, type: 'INTERNAL', isActive: true }
          });
        }
        sellersMap.set(vendedor, seller.id);
        sellerId = seller.id;
      }
    }

    // 2. Create/Update Customer
    try {
      const existing = await prisma.customer.findFirst({
        where: {
          fullName: nome,
          document: document || undefined,
        }
      });

      if (existing) {
        console.log(`Pulando ${nome} (já existe)`);
        continue;
      }

      const customer = await prisma.customer.create({
        data: {
          personType: tipo === 'Pessoa Jurídica' ? 'COMPANY' : 'INDIVIDUAL',
          fullName: nome,
          tradeName: razaoSocial || null,
          document: document || null,
          gender: sexo || null,
          birthDate: nascimento ? new Date(nascimento) : null,
          creditLimit: limite ? parseFloat(limite.replace(',', '.')) : 0,
          commercialStatus: situacao === 'Ativo' ? 'ACTIVE' : 'PROSPECT',
          priority: prioridade || 'NORMAL',
          sellerId: sellerId,
          notes: observacao || null,
          isActive: true,
        }
      });

      // 3. Create Address
      if (endereco || cep || cidade || uf) {
        await prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            type: 'MAIN',
            street: endereco?.replace(/\n/g, ' ') || null,
            zipCode: cep?.replace(/\n/g, '') || null,
            city: cidade?.replace(/\n/g, '') || null,
            state: uf?.replace(/\n/g, '') || null,
            isMain: true
          }
        });
      }

      // 4. Create Contacts
      if (contatos) {
        const contactLines = contatos.split('\n');
        for (const line of contactLines) {
          if (!line.includes(':')) continue;
          const [cName, cInfo] = line.split(':').map(s => s.trim());
          if (!cInfo) continue;
          
          await prisma.customerContact.create({
            data: {
              customerId: customer.id,
              name: cName || 'Contato',
              phone: cInfo.includes('@') ? null : cInfo,
              notes: cInfo.includes('@') ? cInfo : null
            }
          });
        }
      }
    } catch (e) {
      console.error(`Erro ao importar ${nome}:`, e);
    }
  }

  console.log('Importação concluída!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
