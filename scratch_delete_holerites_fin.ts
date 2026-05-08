import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Iniciando exclusão de lançamentos de holerites em Contas a Pagar...");
  
  const deleted = await prisma.accountPayable.deleteMany({
    where: {
      description: {
        contains: "Holerite",
        mode: "insensitive"
      }
    }
  });
  
  console.log(`Sucesso: ${deleted.count} lançamentos excluídos.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
