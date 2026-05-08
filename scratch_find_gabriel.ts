import { prisma } from "./src/lib/prisma";

async function main() {
  const employees = await prisma.employee.findMany({
    where: {
      name: {
        contains: "Gabriel Valentin",
        mode: "insensitive",
      },
    },
    include: {
      documents: {
        where: {
          type: "ATTENDANCE_MIRROR",
        },
      },
    },
  });

  console.log(JSON.stringify(employees, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
