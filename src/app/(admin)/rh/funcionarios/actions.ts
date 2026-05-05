"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type BirthdayAction = "LEAVE" | "ACKNOWLEDGE"

export async function processBirthdayAction({
  employeeId,
  actionType,
  date,
  year = new Date().getFullYear()
}: {
  employeeId: string
  actionType: BirthdayAction
  date?: string
  year?: number
}) {
  try {
    // 1. Registrar a nota de processamento (para ambos os casos)
    // Usamos um padrão de conteúdo para identificar que este aniversário já foi "visto" este ano
    const ackTag = `[BIRTHDAY_NOTED_${year}]`
    
    await prisma.employeeNote.create({
      data: {
        employeeId,
        content: actionType === "LEAVE" 
          ? `${ackTag} Folga prêmio concedida para o dia ${new Date(date!).toLocaleDateString('pt-BR')}.`
          : `${ackTag} Parabenização realizada / Aniversário visualizado pelo RH.`,
      }
    })

    // 2. Se for Folga Prêmio, criar o registro de presença
    if (actionType === "LEAVE" && date) {
      const leaveDate = new Date(date)
      leaveDate.setHours(0, 0, 0, 0)

      await prisma.attendanceDay.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: leaveDate
          }
        },
        update: {
          adjustmentType: "FOLGA_PREMIO",
          status: "ADJUSTED",
          isManualAdjustment: true,
          adjustmentReason: "Folga Prêmio Aniversário"
        },
        create: {
          employeeId,
          date: leaveDate,
          adjustmentType: "FOLGA_PREMIO",
          status: "ADJUSTED",
          isManualAdjustment: true,
          adjustmentReason: "Folga Prêmio Aniversário",
          expectedMinutes: 0,
          workedMinutes: 0,
          overtimeMinutes: 0,
          deficitMinutes: 0
        }
      })
    }

    revalidatePath("/rh/funcionarios")
    return { success: true }
  } catch (error) {
    console.error("Erro ao processar ação de aniversário:", error)
    return { success: false, error: "Falha ao processar ação." }
  }
}
