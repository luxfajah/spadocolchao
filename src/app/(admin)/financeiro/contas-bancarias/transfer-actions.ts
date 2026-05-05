"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function executeTransfer(data: {
  originAccountId: string,
  destinationAccountId: string,
  amount: number,
  date: Date,
  notes?: string
}) {
  const { originAccountId, destinationAccountId, amount, date, notes } = data

  if (originAccountId === destinationAccountId) {
    throw new Error("Contas de origem e destino não podem ser as mesmas.")
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Transaction Out
    const exitTx = await tx.financialTransaction.create({
      data: {
        type: "EXIT",
        amount: amount,
        transactionDate: date,
        description: `Transferência enviada para Conta Destino${notes ? ` — ${notes}` : ''}`,
        status: "CONFIRMED",
        financialAccountId: originAccountId,
        isTransfer: true,
      }
    })

    // 2. Transaction In
    const entryTx = await tx.financialTransaction.create({
      data: {
        type: "ENTRY",
        amount: amount,
        transactionDate: date,
        description: `Transferência recebida da Conta Origem${notes ? ` — ${notes}` : ''}`,
        status: "CONFIRMED",
        financialAccountId: destinationAccountId,
        isTransfer: true,
      }
    })

    // 3. Transfer Record
    await tx.transferRecord.create({
      data: {
        fromAccountId: originAccountId,
        toAccountId: destinationAccountId,
        amount,
        description: notes,
        transactions: {
          connect: [
            { id: exitTx.id },
            { id: entryTx.id }
          ]
        }
      }
    })

    // 4. Update Balances
    await tx.financialAccount.update({
      where: { id: originAccountId },
      data: { currentBalance: { decrement: amount } }
    })

    await tx.financialAccount.update({
      where: { id: destinationAccountId },
      data: { currentBalance: { increment: amount } }
    })
    
    return true
  }).then((res) => {
    revalidatePath("/financeiro/contas-bancarias")
    revalidatePath("/financeiro/dashboard")
    revalidatePath("/financeiro/fluxo-de-caixa")
    return res
  })
}
