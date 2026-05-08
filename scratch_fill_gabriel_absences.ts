import { prisma } from "./src/lib/prisma";
import { createBusinessDateTime, getStoredAttendanceDateKey, getStoredAttendanceWeekDay } from "./src/lib/attendance/business-time";

async function main() {
  const employeeId = "cmouglh6r0005x3jat2zrl2aa"; // Gabriel Santi

  const absentDays = await prisma.attendanceDay.findMany({
    where: { 
        employeeId, 
        date: { gte: new Date("2026-04-01T00:00:00Z"), lte: new Date("2026-04-30T23:59:59Z") }, 
        status: "ABSENT" 
    }
  });

  console.log(`Encontrados ${absentDays.length} dias de falta para Gabriel em Abril.`);

  for (const day of absentDays) {
    const dateKey = getStoredAttendanceDateKey(day.date);
    const weekDay = getStoredAttendanceWeekDay(day.date);
    
    // Escala Logística Padrão: 08-12, 14-18
    let p1 = createBusinessDateTime(dateKey, "08:00");
    let p2 = createBusinessDateTime(dateKey, "12:00");
    let p3 = createBusinessDateTime(dateKey, "14:00");
    let p4 = createBusinessDateTime(dateKey, "18:00");
    let worked = 480;

    if (weekDay === 6) { // Sábado: 08-12
        p1 = createBusinessDateTime(dateKey, "08:00");
        p2 = null; p3 = null;
        p4 = createBusinessDateTime(dateKey, "12:00");
        worked = 240;
    }

    console.log(`  - Preenchendo dia ${dateKey} com escala normal e status WORKED_COMPLETE...`);
    await prisma.attendanceDay.update({
        where: { id: day.id },
        data: {
            firstIn: p1,
            lunchOut: p2,
            lunchIn: p3,
            lastOut: p4,
            workedMinutes: worked,
            deficitMinutes: 0,
            status: "WORKED_COMPLETE", // Usuário pediu para não colocar como ADJUSTED
            isManualAdjustment: true,
            adjustmentType: "FULL_DAY",
            adjustmentReason: "Ajuste de falta retroativo conforme orientação."
        }
    });
  }

  // Recalcular o sumário do espelho
  const mirror = await (prisma as any).attendanceMirror.findFirst({
      where: { employeeId, period: "2026-04" }
  });

  if (mirror) {
      console.log("Atualizando totais e sumário do espelho...");
      const days = await prisma.attendanceDay.findMany({
          where: { mirrorId: mirror.id }
      });

      const totalWorked = days.reduce((acc: number, d: any) => acc + d.workedMinutes, 0);
      const totalExpected = days.reduce((acc: number, d: any) => acc + d.expectedMinutes, 0);
      const totalOvertime = days.reduce((acc: number, d: any) => acc + d.overtimeMinutes, 0);
      const totalDeficit = days.reduce((acc: number, d: any) => acc + d.deficitMinutes, 0);

      const summary = {
          absences: days.filter((d: any) => d.status === "ABSENT").length,
          incomplete: days.filter((d: any) => d.status === "WORKED_INCOMPLETE").length,
          holidays: days.filter((d: any) => d.status === "HOLIDAY" || d.status === "HOLIDAY_WORKED").length,
          weeklyRest: days.filter((d: any) => d.status === "WEEKLY_REST").length,
          holidayWorked: days.filter((d: any) => d.status === "HOLIDAY_WORKED").length,
          weeklyRestWorked: days.filter((d: any) => d.status === "WEEKLY_REST_WORKED").length,
          adjusted: days.filter((d: any) => d.isManualAdjustment).length
      };

      await (prisma as any).attendanceMirror.update({
          where: { id: mirror.id },
          data: {
              workedMinutes: totalWorked,
              expectedMinutes: totalExpected,
              overtimeMinutes: totalOvertime,
              deficitMinutes: totalDeficit,
              summary: JSON.stringify(summary)
          }
      });
  }

  console.log("Concluído!");
}

main()
  .catch(console.error)
  .finally(async () => {
    try {
        await (prisma as any).$disconnect();
    } catch (e) {}
  });
