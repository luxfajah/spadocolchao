import { prisma } from "@/lib/prisma"

type PayrollWithMirrorId = {
  attendanceMirrorId?: string | null
  notes?: string | null
}

type AttachedAttendanceMirror = {
  id: string
  period: string
  status: string
  startDate: Date
  endDate: Date
}

const MIRROR_NOTE_PATTERNS = [
  /Espelho aprovado utilizado:\s*([a-z0-9]+)/i,
  /Espelho:\s*([a-z0-9]+)/i,
]

export function extractAttendanceMirrorId(payroll: PayrollWithMirrorId) {
  if (payroll.attendanceMirrorId) {
    return payroll.attendanceMirrorId
  }

  const notes = payroll.notes || ""

  for (const pattern of MIRROR_NOTE_PATTERNS) {
    const match = notes.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

export function buildAttendanceMirrorNote(mirrorId: string, currentNotes?: string | null) {
  const sanitizedNotes = (currentNotes || "")
    .replace(/Espelho aprovado utilizado:\s*[a-z0-9]+/gi, "")
    .replace(/Espelho:\s*[a-z0-9]+/gi, "")
    .replace(/\s+\|\s+/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^\|\s*/, "")
    .replace(/\s*\|$/, "")

  const mirrorNote = `Espelho aprovado utilizado: ${mirrorId}`

  return sanitizedNotes ? `${sanitizedNotes} | ${mirrorNote}` : mirrorNote
}

export async function attachAttendanceMirrors<T extends PayrollWithMirrorId>(
  payrolls: T[]
): Promise<Array<T & { attendanceMirror: AttachedAttendanceMirror | null }>> {
  const mirrorIds = Array.from(
    new Set(
      payrolls
        .map((payroll) => extractAttendanceMirrorId(payroll))
        .filter((mirrorId): mirrorId is string => Boolean(mirrorId))
    )
  )

  if (mirrorIds.length === 0) {
    return payrolls.map((payroll) => ({
      ...payroll,
      attendanceMirror: null,
    }))
  }

  const mirrors = await prisma.attendanceMirror.findMany({
    where: {
      id: {
        in: mirrorIds,
      },
    },
    select: {
      id: true,
      period: true,
      status: true,
      startDate: true,
      endDate: true,
    },
  })

  const mirrorsById = new Map(mirrors.map((mirror) => [mirror.id, mirror]))

  return payrolls.map((payroll) => {
    const mirrorId = extractAttendanceMirrorId(payroll)

    return {
      ...payroll,
      attendanceMirror: mirrorId ? mirrorsById.get(mirrorId) || null : null,
    }
  })
}
