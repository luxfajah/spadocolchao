import { prisma } from "./src/lib/prisma";
import { createBusinessDateTime, getStoredAttendanceDateKey, getStoredAttendanceWeekDay } from "./src/lib/attendance/business-time";
import { getHolidaysForRange } from "./src/lib/attendance/holidays";

async function main() {
  const ids = {
    eduardo: "cmotljsjh00019adbcpo77u01",
    edgar: "cmotlju5q00039adb6t3ukusp"
  };

  const scheduleId = "cmotez9kq00094lm77llkemlh"; // Administrativo Padrão (08-12, 14-18)

  // 1. Atualizar escala deles no perfil para referência futura
  console.log("Atribuindo escala Administrativo Padrão...");
  await prisma.employee.updateMany({
    where: { id: { in: Object.values(ids) } },
    data: { workScheduleId: scheduleId }
  });

  const startDate = new Date(Date.UTC(2026, 3, 1));
  const endDate = new Date(Date.UTC(2026, 3, 30));
  const holidays = getHolidaysForRange(startDate, endDate);

  for (const [name, employeeId] of Object.entries(ids)) {
    console.log(`\nProcessando ${name} (Abril 2026)...`);

    // Encontrar ou criar o espelho de Abril
    let mirror = await (prisma as any).attendanceMirror.findFirst({
        where: { employeeId, period: "2026-04" }
    });

    if (!mirror) {
        mirror = await (prisma as any).attendanceMirror.create({
            data: {
                employeeId,
                period: "2026-04",
                startDate,
                endDate,
                status: "GENERATED",
                expectedMinutes: 0,
                workedMinutes: 0,
                overtimeMinutes: 0,
                deficitMinutes: 0
            }
        });
    }

    // Limpar dias existentes para evitar duplicidade ou dados parciais
    await (prisma as any).attendanceDay.deleteMany({
        where: { employeeId, mirrorId: mirror.id }
    });

    let totalExpected = 0;
    let totalWorked = 0;
    let summary = {
        absences: 0,
        incomplete: 0,
        holidays: 0,
        weeklyRest: 0,
        holidayWorked: 0,
        weeklyRestWorked: 0,
        adjusted: 0
    };

    let curr = new Date(startDate);
    const dayRecords = [];

    while (curr <= endDate) {
        const dateKey = getStoredAttendanceDateKey(curr);
        const weekDay = getStoredAttendanceWeekDay(curr);
        const holiday = holidays.get(dateKey);

        let status = "WORKED_COMPLETE";
        let expected = 480;
        let worked = 480;
        let p1 = createBusinessDateTime(dateKey, "08:00");
        let p2 = createBusinessDateTime(dateKey, "12:00");
        let p3 = createBusinessDateTime(dateKey, "14:00");
        let p4 = createBusinessDateTime(dateKey, "18:00");
        let isAdjusted = true;

        if (holiday) {
            status = "HOLIDAY";
            expected = 0; worked = 0;
            p1 = null; p2 = null; p3 = null; p4 = null;
            isAdjusted = false;
            summary.holidays++;
        } else if (weekDay === 0) {
            status = "WEEKLY_REST";
            expected = 0; worked = 0;
            p1 = null; p2 = null; p3 = null; p4 = null;
            isAdjusted = false;
            summary.weeklyRest++;
        } else {
            if (weekDay === 6) { // Sábado
                expected = 240; worked = 240;
                p1 = createBusinessDateTime(dateKey, "08:00");
                p2 = null; p3 = null;
                p4 = createBusinessDateTime(dateKey, "12:00");
            }
            summary.adjusted++;
        }

        totalExpected += expected;
        totalWorked += worked;

        dayRecords.push({
            employeeId,
            mirrorId: mirror.id,
            date: new Date(curr),
            expectedMinutes: expected,
            workedMinutes: worked,
            overtimeMinutes: 0,
            deficitMinutes: 0,
            firstIn: p1,
            lunchOut: p2,
            lunchIn: p3,
            lastOut: p4,
            status: isAdjusted ? "ADJUSTED" : status,
            isManualAdjustment: isAdjusted,
            adjustmentType: isAdjusted ? "FULL_DAY" : null,
            adjustmentReason: isAdjusted ? "Ajuste manual retroativo: Trabalhou o mês todo conforme escala normal, mas não bateu ponto no relógio." : null,
            anomalies: "[]"
        });

        curr.setUTCDate(curr.getUTCDate() + 1);
    }

    console.log(`  - Criando ${dayRecords.length} registros diários...`);
    await (prisma as any).attendanceDay.createMany({ data: dayRecords });

    console.log(`  - Atualizando sumário do espelho...`);
    await (prisma as any).attendanceMirror.update({
        where: { id: mirror.id },
        data: {
            expectedMinutes: totalExpected,
            workedMinutes: totalWorked,
            overtimeMinutes: 0,
            deficitMinutes: 0,
            summary: JSON.stringify(summary),
            status: "GENERATED"
        }
    });
  }

  console.log("\nProcesso concluído com sucesso!");
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
