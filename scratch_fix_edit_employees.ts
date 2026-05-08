import { prisma } from "./src/lib/prisma";

async function main() {
  const ids = {
    eduardo: "cmotljsjh00019adbcpo77u01",
    edgar: "cmotlju5q00039adb6t3ukusp",
    douglas: "cmotljxef00079adbcufs3f7a"
  };

  const costCenterId = "cmotelmun00471doa0g8bkflk"; // PRODUÇÃO
  const scheduleId = "cmotez9kq00094lm77llkemlh"; // Administrativo Padrão
  const admissionDate = new Date("2026-04-01T12:00:00Z");

  console.log("Normalizando dados dos funcionários para permitir edição...");

  // Eduardo
  await prisma.employee.update({
    where: { id: ids.eduardo },
    data: {
      cpf: "000.000.000-08",
      costCenterId,
      admissionDate,
      salaryBase: 1500 // Colocando um valor base
    }
  });

  // Edgar
  await prisma.employee.update({
    where: { id: ids.edgar },
    data: {
      cpf: "000.000.000-07",
      costCenterId,
      admissionDate,
      salaryBase: 1500
    }
  });

  // Douglas
  await prisma.employee.update({
    where: { id: ids.douglas },
    data: {
      cpf: "000.000.000-06",
      costCenterId,
      workScheduleId: scheduleId,
      admissionDate,
      salaryBase: 1500
    }
  });

  console.log("Sucesso! Os funcionários agora possuem CPF, Centro de Custo e Escala preenchidos, o que deve liberar a edição na interface.");
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
