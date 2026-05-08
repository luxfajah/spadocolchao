import { prisma } from "./src/lib/prisma";
import { recalculateEmployeeMonth } from "./src/lib/attendance/service";

async function main() {
  const openMirrors = await (prisma as any).attendanceMirror.findMany({
    where: { status: { not: "APPROVED" } },
    include: { employee: true }
  });

  console.log(`Encontrados ${openMirrors.length} espelhos para re-corrigir (desfazendo o erro e aplicando a correção correta).`);

  for (const mirror of openMirrors) {
    const { employeeId, period, startDate, endDate } = mirror;
    const employeeName = mirror.employee?.fullName || "Desconhecido";
    console.log(`\nProcessando: ${employeeName} (${period})`);

    const parts = period.split("-").map(Number);
    const year = parts[0];
    const month = parts[1];

    // Intervalo de segurança para capturar o que deslocamos antes
    const start = new Date(startDate);
    start.setDate(start.getDate() - 5);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 5);

    // 1. Shift TimePunch -2 dias (desfaz o +1 anterior e aplica o -1 correto)
    const timePunches = await (prisma as any).timePunch.findMany({
      where: {
        employeeId,
        punchDateTime: { gte: start, lte: end }
      }
    });

    console.log(`  - Shifting ${timePunches.length} TimePunches (-2 dias)...`);
    for (const tp of timePunches) {
      const oldDate = new Date(tp.punchDateTime);
      const newDate = new Date(oldDate);
      newDate.setDate(newDate.getDate() - 2);
      
      await (prisma as any).timePunch.update({
        where: { id: tp.id },
        data: { punchDateTime: newDate }
      });
    }

    // 2. Shift PunchRecord -2 dias
    const punchRecords = await (prisma as any).punchRecord.findMany({
      where: {
        employeeId,
        punchDate: { gte: start, lte: end }
      }
    });

    if (punchRecords.length > 0) {
      console.log(`  - Shifting ${punchRecords.length} PunchRecords (-2 dias)...`);
      for (const pr of punchRecords) {
        const oldDate = new Date(pr.punchDate);
        const newDate = new Date(oldDate);
        newDate.setDate(newDate.getDate() - 2);

        await (prisma as any).punchRecord.update({
          where: { id: pr.id },
          data: { punchDate: newDate }
        });
      }
    }

    // 3. Recalcular o espelho
    console.log(`  - Recalculando espelho...`);
    try {
      await recalculateEmployeeMonth(employeeId, year, month);
      console.log(`  - OK!`);
    } catch (err) {
      console.error(`  - Erro ao recalcular:`, err);
    }
  }

  console.log("\nCorreção de reversão finalizada!");
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
