"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCashSessions(status?: string) {
  const where: any = {}
  if (status && status !== "ALL") {
    where.status = status
  }

  return await prisma.cashRegisterSession.findMany({
    where,
    include: {
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
      _count: {
        select: { movements: true, sales: true }
      }
    },
    orderBy: { openedAt: "desc" }
  })
}

export async function getSessionDetails(sessionId: string) {
  return await prisma.cashRegisterSession.findUnique({
    where: { id: sessionId },
    include: {
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
      movements: {
        orderBy: { createdAt: 'desc' }
      },
      sales: {
        include: {
          customer: { select: { fullName: true } }
        }
      }
    }
  })
}

export async function closeCashSession(sessionId: string, data: {
  reportedBalance: number,
  closingUserId: string,
  notes?: string
}) {
  const session = await prisma.cashRegisterSession.findUnique({
    where: { id: sessionId },
    include: { movements: true }
  })

  if (!session) throw new Error("Sessão não encontrada")
  if (session.status === "CLOSED") throw new Error("A sessão já está fechada")

  // Calcular expected balance
  const entries = session.movements.filter(m => m.type === 'ENTRY').reduce((acc, m) => acc + m.amount, 0)
  const exits = session.movements.filter(m => m.type === 'EXIT').reduce((acc, m) => acc + m.amount, 0)
  const expectedBalance = session.openingBalance + entries - exits
  
  const difference = data.reportedBalance - expectedBalance

  const closedSession = await prisma.cashRegisterSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: data.closingUserId,
      closingBalance: data.reportedBalance,
      expectedBalance: expectedBalance,
      difference: difference,
      notes: data.notes
    }
  })

  revalidatePath("/financeiro/fechamento-de-caixa")
  revalidatePath("/financeiro/dashboard")
  revalidatePath("/pdv")
  return closedSession
}
