const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    const p1 = prisma.user.count();
    const p2 = new Promise((resolve, reject) => setTimeout(() => reject('timeout'), 5000));
    const result = await Promise.race([p1, p2]);
    console.log("DB count:", result);
  } catch (error) {
    console.error("Error or timeout:", error);
  } finally {
    await prisma.$disconnect();
  }
}
checkDb();
