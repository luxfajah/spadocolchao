"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  getBusinessDateKeyFromInstant,
  getBusinessDayBounds,
} from "@/lib/attendance/business-time"
import { recalculateEmployeeMonth } from "@/lib/attendance/service"
import { APP_PUNCH_TYPES } from "./constants"

export async function getEmployeePunchStatus() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { error: "Não autenticado" }
    }

    if (!user.employeeId) {
      return { error: "Usuário não vinculado a um colaborador" }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: {
        workSchedule: true,
      },
    })

    if (!employee) {
      return { error: "Colaborador não encontrado" }
    }

    // Buscar as batidas de hoje no fuso horário de SP
    const todayKey = getBusinessDateKeyFromInstant(new Date())
    const bounds = getBusinessDayBounds(todayKey)

    const punches = await (prisma as any).timePunch.findMany({
      where: {
        employeeId: employee.id,
        punchDateTime: {
          gte: bounds.start,
          lt: bounds.endExclusive,
        },
      },
      orderBy: { punchDateTime: "asc" },
    })

    // Mapear batidas e ver qual o próximo passo recomendado
    let nextIndex = 0
    if (punches.length > 0) {
      // Se já bateu ponto hoje, a recomendada é a próxima na sequência
      // Por exemplo, se tem 1 batida (S), recomenda E. Se tem 2 (S, E), recomenda A.
      nextIndex = Math.min(punches.length, APP_PUNCH_TYPES.length - 1)
    }

    return {
      success: true,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        socialName: employee.socialName,
        pointMachineId: employee.pointMachineId,
        code: employee.code,
      },
      punches: punches.map((p: any) => ({
        id: p.id,
        punchDateTime: p.punchDateTime,
        type: p.type,
        rawType: p.rawType,
      })),
      recommendedNextPunch: APP_PUNCH_TYPES[nextIndex],
      todayKey,
    }
  } catch (error: any) {
    console.error("Erro ao obter status de ponto:", error)
    return { error: "Erro interno no servidor: " + error.message }
  }
}

export async function registerPunchAction(
  rawType: string,
  latitude?: number,
  longitude?: number,
  accuracy?: number
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { error: "Não autenticado" }
    }

    if (!user.employeeId) {
      return { error: "Usuário não possui colaborador vinculado" }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { workSchedule: true },
    })

    if (!employee) {
      return { error: "Colaborador não cadastrado" }
    }

    const matchedType = APP_PUNCH_TYPES.find((t) => t.rawType === rawType)
    if (!matchedType) {
      return { error: "Tipo de batida inválido" }
    }

    const now = new Date()

    // 1. Criar lote de importação se não houver um padrão para o app hoje
    // Para simplificar e manter a consistência, podemos agrupar batidas do dia em um lote "App Celular"
    const todayKey = getBusinessDateKeyFromInstant(now)
    const fileName = `App Ponto - ${todayKey}`

    let importBatch = await (prisma as any).timePunchImport.findFirst({
      where: { fileName },
    })

    if (!importBatch) {
      importBatch = await (prisma as any).timePunchImport.create({
        data: {
          fileName,
          status: "COMPLETED",
          recordsCount: 0,
        },
      })
    }

    // 2. Registrar a batida
    const punch = await (prisma as any).timePunch.create({
      data: {
        importId: importBatch.id,
        employeeId: employee.id,
        enNo: employee.pointMachineId || employee.code || employee.id,
        punchDateTime: now,
        type: matchedType.type,
        rawType: rawType,
        isNormalized: false,
      },
    })

    // 3. Atualizar quantidade de registros no lote
    await (prisma as any).timePunchImport.update({
      where: { id: importBatch.id },
      data: {
        recordsCount: { increment: 1 },
      },
    })

    // 4. Salvar localização se disponível na tabela UserLocationHistory e atualizar UserLocation
    if (latitude && longitude) {
      const locationId = crypto.randomUUID()

      // Registrar no histórico
      await (prisma as any).userLocationHistory.create({
        data: {
          id: locationId,
          userId: user.id,
          latitude,
          longitude,
          accuracy: accuracy || null,
          isIdle: true,
          createdAt: now,
        },
      })

      // Atualizar posição atual em tempo real
      const existingLoc = await (prisma as any).userLocation.findUnique({
        where: { userId: user.id },
      })

      if (existingLoc) {
        await (prisma as any).userLocation.update({
          where: { userId: user.id },
          data: {
            latitude,
            longitude,
            accuracy: accuracy || null,
            updatedAt: now,
          },
        })
      } else {
        await (prisma as any).userLocation.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            latitude,
            longitude,
            accuracy: accuracy || null,
            updatedAt: now,
            createdAt: now,
          },
        })
      }
    }

    // 5. Recalcular o espelho de ponto deste colaborador para o mês atual
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    await recalculateEmployeeMonth(employee.id, year, month)

    revalidatePath("/app-ponto")
    revalidatePath("/app-ponto/historico")
    revalidatePath(`/rh/ponto/${employee.id}`)

    return {
      success: true,
      punch: {
        id: punch.id,
        punchDateTime: punch.punchDateTime,
        type: punch.type,
        rawType: punch.rawType,
      },
    }
  } catch (error: any) {
    console.error("Erro ao registrar ponto:", error)
    return { error: "Erro interno no servidor: " + error.message }
  }
}

export async function getEmployeeHistoryData(selectedPeriod?: string) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { error: "Não autenticado" }
    }

    if (!user.employeeId) {
      return { error: "Usuário não vinculado a um colaborador" }
    }

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentPeriodKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`
    const targetPeriod = selectedPeriod || currentPeriodKey

    // 1. Buscar todos os espelhos do colaborador para montar a lista de meses disponíveis
    const allMirrors = await (prisma as any).attendanceMirror.findMany({
      where: { employeeId: user.employeeId },
      select: {
        id: true,
        period: true,
        startDate: true,
        endDate: true,
        status: true,
      },
      orderBy: { period: "desc" },
    })

    // 2. Buscar o espelho do período selecionado (com os dias detalhados)
    const mirror = await (prisma as any).attendanceMirror.findFirst({
      where: {
        employeeId: user.employeeId,
        period: targetPeriod,
      },
      include: {
        days: {
          orderBy: { date: "asc" },
        },
      },
    })

    // 3. Buscar todos os holerites publicados (PAID ou GENERATED) do colaborador
    const payrolls = await (prisma as any).payroll.findMany({
      where: {
        employeeId: user.employeeId,
        status: { in: ["GENERATED", "PAID"] },
      },
      orderBy: { referencePeriod: "desc" },
    })

    return {
      success: true,
      periods: allMirrors.map((m: any) => ({
        period: m.period,
        startDate: m.startDate,
        endDate: m.endDate,
      })),
      activeMirror: mirror
        ? {
            id: mirror.id,
            period: mirror.period,
            startDate: mirror.startDate,
            endDate: mirror.endDate,
            expectedMinutes: mirror.expectedMinutes,
            workedMinutes: mirror.workedMinutes,
            overtimeMinutes: mirror.overtimeMinutes,
            deficitMinutes: mirror.deficitMinutes,
            status: mirror.status,
            days: mirror.days.map((d: any) => ({
              id: d.id,
              date: d.date,
              expectedMinutes: d.expectedMinutes,
              workedMinutes: d.workedMinutes,
              overtimeMinutes: d.overtimeMinutes,
              deficitMinutes: d.deficitMinutes,
              firstIn: d.firstIn,
              lunchOut: d.lunchOut,
              lunchIn: d.lunchIn,
              lastOut: d.lastOut,
              status: d.status,
              anomalies: d.anomalies ? JSON.parse(d.anomalies) : [],
            })),
          }
        : null,
      payrolls: payrolls.map((p: any) => ({
        id: p.id,
        referencePeriod: p.referencePeriod,
        netSalary: p.netSalary,
        grossSalary: p.grossSalary,
        status: p.status,
        createdAt: p.createdAt,
      })),
      targetPeriod,
    }
  } catch (error: any) {
    console.error("Erro ao buscar dados de histórico:", error)
    return { error: "Erro interno no servidor: " + error.message }
  }
}

export async function downloadPayrollPdfAction(payrollId: string) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { error: "Não autenticado" }
    }

    if (!user.employeeId) {
      return { error: "Usuário não possui colaborador vinculado" }
    }

    // Garantir que o holerite pertence ao colaborador logado para evitar vazamento de dados
    const payroll = await (prisma as any).payroll.findFirst({
      where: {
        id: payrollId,
        employeeId: user.employeeId,
        status: { in: ["GENERATED", "PAID"] },
      },
    })

    if (!payroll) {
      return { error: "Holerite não encontrado ou indisponível para este colaborador" }
    }

    const { generateOfficialPayrollPdf } = await import("@/lib/payroll/official-payroll-pdf")
    const result = await generateOfficialPayrollPdf(payrollId)

    return {
      success: true,
      fileUrl: result.fileUrl,
      documentName: result.documentName,
    }
  } catch (error: any) {
    console.error("Erro ao gerar PDF de holerite:", error)
    return { error: "Erro interno no servidor: " + error.message }
  }
}
