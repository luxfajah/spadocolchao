const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const ana = await prisma.employee.findFirst({
    where: { fullName: { contains: 'Ana', mode: 'insensitive' } },
    include: { attendanceMirrors: true }
  });
  console.log(JSON.stringify(ana.attendanceMirrors, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
