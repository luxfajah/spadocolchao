const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const addresses = await prisma.customerAddress.findMany();
  
  let updatedCount = 0;

  for (const address of addresses) {
    let changed = false;
    let data = {};

    // 1. Fix Zip
    if (address.zipCode && address.zipCode.length === 16 && address.zipCode.slice(0,8) === address.zipCode.slice(8)) {
      data.zipCode = address.zipCode.slice(0,8);
      changed = true;
    }

    // 2. Fix City
    if (address.city) {
      const half = address.city.length / 2;
      if (Number.isInteger(half) && address.city.slice(0, half) === address.city.slice(half)) {
        data.city = address.city.slice(0, half);
        changed = true;
      }
    }

    // 3. Fix State
    if (address.state && address.state.length === 4 && address.state.slice(0,2) === address.state.slice(2)) {
      data.state = address.state.slice(0,2);
      changed = true;
    }

    // 4. Fix Street / Number / Neighborhood
    if (address.street && address.street.includes(' - ')) {
      const firstPart = address.street.split(' - ')[0].trim();
      
      // Match: "Street name, 123 Neighborhood"
      // or "Street name, S/N Neighborhood"
      const match = firstPart.match(/^([^,]+),\s*([\w\d\/-]+)\s*(.*)$/);
      if (match) {
        data.street = match[1].trim();
        data.number = match[2].trim();
        data.neighborhood = match[3].trim();
        changed = true;
      } else {
        // Just take the first part
        if (address.street !== firstPart) {
          data.street = firstPart;
          changed = true;
        }
      }
    }

    if (changed) {
      await prisma.customerAddress.update({
        where: { id: address.id },
        data
      });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} addresses.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
