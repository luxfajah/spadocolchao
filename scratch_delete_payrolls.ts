import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Iniciando exclusão de holerites (Payroll)...");
  
  // Deletar todos os registros de Payroll
  const deleted = await (prisma as any).payroll.deleteMany({});
  
  console.log(`Sucesso: ${deleted.count} holerites excluídos.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
