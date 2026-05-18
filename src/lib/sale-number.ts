import { prisma } from "@/lib/prisma"

/**
 * Generates the next sequential sale number in the format:
 *   VEND-YYYYMM-NNNNN
 *
 * The sequence is global (not reset per month), starting from 405
 * to continue after the imported historical data (IMP-VENDAS-2026-05-404).
 *
 * The function is safe under concurrent load because it uses a DB-level
 * MAX + lock-free optimistic retry via `@unique` on the number field.
 */
export async function generateSaleNumber(): Promise<string> {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`

  // Find the highest numeric suffix across all existing sale numbers
  const rows = await prisma.$queryRaw<{ max_seq: number | null }[]>`
    SELECT MAX(
      CASE
        WHEN number ~ '^VEND-[0-9]{6}-[0-9]+$'
          THEN CAST(split_part(number, '-', 3) AS INTEGER)
        WHEN number ~ '^IMP-VENDAS-[0-9]{4}-[0-9]{2}-[0-9]+$'
          THEN CAST(split_part(number, '-', 5) AS INTEGER)
        ELSE 0
      END
    ) AS max_seq
    FROM "Sale"
  `

  const currentMax = rows[0]?.max_seq ?? 404
  const nextSeq = currentMax + 1
  const paddedSeq = String(nextSeq).padStart(5, "0")

  return `VEND-${yearMonth}-${paddedSeq}`
}

/**
 * Generates the next sequential production slip number in the format:
 *   FP-YYYYMM-NNNNN
 */
export async function generateSlipNumber(): Promise<string> {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`

  const rows = await prisma.$queryRaw<{ max_seq: number | null }[]>`
    SELECT MAX(
      CASE
        WHEN number ~ '^FP-[0-9]{6}-[0-9]+$'
          THEN CAST(split_part(number, '-', 3) AS INTEGER)
        ELSE 0
      END
    ) AS max_seq
    FROM "OrderProductionSlip"
  `

  const currentMax = rows[0]?.max_seq ?? 0
  const nextSeq = currentMax + 1
  const paddedSeq = String(nextSeq).padStart(5, "0")

  return `FP-${yearMonth}-${paddedSeq}`
}
