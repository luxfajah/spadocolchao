type EmployeePayrollAllocationSource = {
  department?: string | null
  costCenter?: {
    name?: string | null
  } | null
  jobTitle?: {
    department?: string | null
  } | null
}

type PayrollAllocationNotesSource = {
  notes?: string | null
}

export type PayrollAllocationSnapshot = {
  costCenterName: string | null
  sectorName: string | null
}

function normalizeValue(value?: string | null) {
  const sanitizedValue = value?.trim()
  return sanitizedValue ? sanitizedValue : null
}

function cleanupNoteSeparators(value: string) {
  return value
    .replace(/\s+\|\s+/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^\|\s*/, "")
    .replace(/\s*\|$/, "")
}

export function resolveEmployeePayrollAllocation(
  employee: EmployeePayrollAllocationSource
): PayrollAllocationSnapshot {
  return {
    costCenterName: normalizeValue(employee.costCenter?.name),
    sectorName: normalizeValue(employee.department) || normalizeValue(employee.jobTitle?.department),
  }
}

export function extractPayrollAllocationSnapshot(
  source: PayrollAllocationNotesSource
): PayrollAllocationSnapshot {
  const notes = source.notes || ""
  const costCenterMatch = notes.match(/Centro de custo da folha:\s*([^|]+)/i)
  const sectorMatch = notes.match(/Setor da folha:\s*([^|]+)/i)

  return {
    costCenterName: normalizeValue(costCenterMatch?.[1]),
    sectorName: normalizeValue(sectorMatch?.[1]),
  }
}

export function buildPayrollAllocationNote(
  snapshot: PayrollAllocationSnapshot,
  currentNotes?: string | null
) {
  const sanitizedNotes = cleanupNoteSeparators(
    (currentNotes || "")
      .replace(/Centro de custo da folha:\s*[^|]+/gi, "")
      .replace(/Setor da folha:\s*[^|]+/gi, "")
  )

  const noteParts = [sanitizedNotes]

  if (snapshot.costCenterName) {
    noteParts.push(`Centro de custo da folha: ${snapshot.costCenterName}`)
  }

  if (snapshot.sectorName) {
    noteParts.push(`Setor da folha: ${snapshot.sectorName}`)
  }

  return cleanupNoteSeparators(noteParts.filter(Boolean).join(" | "))
}

export function buildPayrollPayableDescription(
  employeeName: string,
  snapshot: PayrollAllocationSnapshot
) {
  const suffixParts = [snapshot.sectorName, snapshot.costCenterName].filter(Boolean)

  return suffixParts.length > 0
    ? `Holerite / Salário Líquido - ${employeeName} - ${suffixParts.join(" / ")}`
    : `Holerite / Salário Líquido - ${employeeName}`
}

export function buildPayrollPayableNotes(
  period: string,
  mirrorId: string | null | undefined,
  snapshot: PayrollAllocationSnapshot
) {
  const noteParts = [
    `Referencia Mes: ${period}`,
    "Vinculo Folha de Pagamento",
    mirrorId ? `Espelho: ${mirrorId}` : null,
    snapshot.costCenterName ? `Centro de custo: ${snapshot.costCenterName}` : null,
    snapshot.sectorName ? `Setor: ${snapshot.sectorName}` : null,
  ]

  return noteParts.filter(Boolean).join(". ") + "."
}

export function formatPayrollAllocationLabel(snapshot: PayrollAllocationSnapshot) {
  const labelParts = [
    snapshot.costCenterName ? `CC: ${snapshot.costCenterName}` : null,
    snapshot.sectorName ? `Setor: ${snapshot.sectorName}` : null,
  ]

  return labelParts.filter(Boolean).join(" • ")
}
