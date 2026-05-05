"use server"

import { revalidatePath } from "next/cache"

import { generateApprovedAttendanceMirrorPdf } from "@/lib/attendance/approved-mirror-pdf"

export async function issueApprovedMirrorPdf(mirrorId: string) {
  const result = await generateApprovedAttendanceMirrorPdf(mirrorId)

  revalidatePath(`/rh/funcionarios/${result.employeeId}`)
  revalidatePath(`/rh/ponto/${result.employeeId}`)
  revalidatePath(`/rh/ponto/espelho/${result.mirrorId}`)
  revalidatePath("/rh/ponto/historico")

  return result
}
