const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log("Connecting to database pooler...");
  // URL-encoding the password's '#' to '%23' and '!' to '%21'
  const databaseUrl = "postgresql://postgres.tqstaitdzyfyjjdrpven:L3FNzJyWUfh%23.E%21@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Total users in database: ${userCount}`);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
