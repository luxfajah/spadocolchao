import { prisma } from "./src/lib/prisma";
import { recalculateEmployeeMonth } from "./src/lib/attendance/service";

async function main() {
  const openMirrors = await (prisma as any).attendanceMirror.findMany({
    where: { status: { not: "APPROVED" } },
    include: { employee: true }
  });

  console.log(`Encontrados ${openMirrors.length} espelhos abertos.`);

  for (const mirror of openMirrors) {
    const { employeeId, period, startDate, endDate } = mirror;
    const employeeName = mirror.employee?.fullName || "Desconhecido";
    console.log(`\nProcessando: ${employeeName} (${period})`);

    const parts = period.split("-").map(Number);
    const year = parts[0];
    const month = parts[1];

    if (!year || !month) {
        console.log(`  - Período inválido: ${period}. Pulando.`);
        continue;
    }

    // Definir intervalo para busca de batidas (com margem de 1 dia para garantir captura)
    const start = new Date(startDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    // 1. Shift TimePunch
    const timePunches = await (prisma as any).timePunch.findMany({
      where: {
        employeeId,
        punchDateTime: { gte: start, lte: end }
      }
    });

    console.log(`  - Shifting ${timePunches.length} TimePunches (+1 dia)...`);
    for (const tp of timePunches) {
      const oldDate = new Date(tp.punchDateTime);
      const newDate = new Date(oldDate);
      newDate.setDate(newDate.getDate() + 1);
      
      await (prisma as any).timePunch.update({
        where: { id: tp.id },
        data: { punchDateTime: newDate }
      });
    }

    // 2. Shift PunchRecord (se existir)
    const punchRecords = await (prisma as any).punchRecord.findMany({
      where: {
        employeeId,
        punchDate: { gte: start, lte: end }
      }
    });

    if (punchRecords.length > 0) {
      console.log(`  - Shifting ${punchRecords.length} PunchRecords (+1 dia)...`);
      for (const pr of punchRecords) {
        const oldDate = new Date(pr.punchDate);
        const newDate = new Date(oldDate);
        newDate.setDate(newDate.getDate() + 1);

        await (prisma as any).punchRecord.update({
          where: { id: pr.id },
          data: { punchDate: newDate }
        });
      }
    }

    // 3. Recalcular o espelho
    console.log(`  - Recalculando espelho para materializar os dias...`);
    try {
      await recalculateEmployeeMonth(employeeId, year, month);
      console.log(`  - OK!`);
    } catch (err) {
      console.error(`  - Erro ao recalcular:`, err);
    }
  }

  console.log("\nCorreção finalizada com sucesso!");
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
