import { NextRequest, NextResponse } from "next/server"
import {
  getEmployeeMonthAttendanceSource,
  recalculateEmployeeMonth,
  recalculateCompetency,
  recalculateAll,
} from "@/lib/attendance/service"
import { isAttendanceAdmin } from "@/lib/attendance/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    if (!await isAttendanceAdmin()) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    const body = await req.json()
    const { mode, employeeId, year, month, period, confirmLocked } = body

    // Validação de modos
    // mode: "employee" | "competency" | "all"
    const resolvedMode = mode || "employee"

    // --- Modo: Recalcular Funcionário no Período ---
    if (resolvedMode === "employee") {
      if (!employeeId || !year || !month) {
        return NextResponse.json(
          { error: "Parâmetros employeeId, year e month são obrigatórios." },
          { status: 400 }
        )
      }

      // Verificar bloqueio de folha
      const periodKey = `${year}-${String(month).padStart(2, "0")}`
      const sourceState = await getEmployeeMonthAttendanceSource(employeeId, parseInt(year), parseInt(month))

      if (!sourceState.hasCollectedData) {
        return NextResponse.json({
          error: "NO_SOURCE_DATA",
          message: "Este período ainda não possui batidas importadas nem espelho gerado a partir do TXT.",
        }, { status: 400 })
      }

      const payroll = await prisma.payroll.findFirst({
        where: {
          employeeId,
          referencePeriod: periodKey,
          status: { in: ["GENERATED", "PAID"] }
        }
      })

      if (payroll && !confirmLocked) {
        return NextResponse.json({
          error: "LOCKED",
          message: "Esta competência já tem folha gerada. Confirme para recalcular mesmo assim.",
          payrollStatus: payroll.status,
        }, { status: 409 })
      }

      // Snapshot de auditoria
      const existingMirror = await (prisma as any).attendanceMirror.findFirst({
        where: { employeeId, period: periodKey },
        include: { days: true }
      })

      if (existingMirror) {
        await (prisma as any).auditLog.create({
          data: {
            action: "RECALCULATE_MIRROR",
            entity: "AttendanceMirror",
            entityId: existingMirror.id,
            details: `Recálculo manual do espelho ${periodKey}`,
            oldData: JSON.stringify({
              expectedMinutes: existingMirror.expectedMinutes,
              workedMinutes: existingMirror.workedMinutes,
              overtimeMinutes: existingMirror.overtimeMinutes,
              deficitMinutes: existingMirror.deficitMinutes,
              daysCount: existingMirror.days.length,
            }),
          }
        })
      }

      const results = await recalculateEmployeeMonth(
        employeeId,
        parseInt(year),
        parseInt(month)
      )

      return NextResponse.json({
        success: true,
        mode: "employee",
        processedDays: results.length,
      })
    }

    // --- Modo: Recalcular Competência ---
    if (resolvedMode === "competency") {
      const targetPeriod = period || (year && month ? `${year}-${String(month).padStart(2, "0")}` : null)
      
      if (!targetPeriod) {
        return NextResponse.json(
          { error: "Parâmetro period (YYYY-MM) é obrigatório." },
          { status: 400 }
        )
      }

      // Verificar se algum funcionário tem folha fechada
      const lockedPayrolls = await (prisma as any).payroll.findMany({
        where: {
          referencePeriod: targetPeriod,
          status: { in: ["GENERATED", "PAID"] }
        },
        select: {
          employeeId: true,
          status: true,
          employee: { select: { fullName: true } },
        },
      })

      if (lockedPayrolls.length > 0 && !confirmLocked) {
        return NextResponse.json({
          error: "LOCKED",
          message: `${lockedPayrolls.length} funcionário(s) com folha gerada/paga neste período.`,
          locked: lockedPayrolls.map((p: any) => ({
            employeeId: p.employeeId,
            name: p.employee?.fullName,
            status: p.status,
          })),
        }, { status: 409 })
      }

      // Auditoria
      await (prisma as any).auditLog.create({
        data: {
          action: "RECALCULATE_COMPETENCY",
          entity: "AttendanceMirror",
          details: `Recálculo em lote da competência ${targetPeriod}`,
        }
      })

      const results = await recalculateCompetency(targetPeriod)

      return NextResponse.json({
        success: true,
        mode: "competency",
        period: targetPeriod,
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results,
      })
    }

    // --- Modo: Recalcular Todos ---
    if (resolvedMode === "all") {
      if (!confirmLocked) {
        // Verificar quantos mirrors existem
        const totalMirrors = await (prisma as any).attendanceMirror.count()
        const lockedPayrolls = await prisma.payroll.count({
          where: { status: { in: ["GENERATED", "PAID"] } }
        })

        return NextResponse.json({
          error: "CONFIRM_REQUIRED",
          message: `Este recálculo afetará ${totalMirrors} espelhos. ${lockedPayrolls} folhas estão geradas/pagas.`,
          totalMirrors,
          lockedPayrolls,
        }, { status: 409 })
      }

      // Auditoria
      await (prisma as any).auditLog.create({
        data: {
          action: "RECALCULATE_ALL",
          entity: "AttendanceMirror",
          details: "Recálculo total de todos os espelhos",
        }
      })

      const results = await recalculateAll()

      return NextResponse.json({
        success: true,
        mode: "all",
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results,
      })
    }

    return NextResponse.json(
      { error: `Modo '${resolvedMode}' não reconhecido. Use: employee, competency, all` },
      { status: 400 }
    )

  } catch (error: any) {
    console.error("Attendance Recalculate Error:", error)
    return NextResponse.json(
      { error: "Erro ao recalcular ponto.", detail: error.message },
      { status: 500 }
    )
  }
}
