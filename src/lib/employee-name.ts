export type EmployeeNameLike = {
  fullName?: string | null
  socialName?: string | null
}

function normalizeName(value?: string | null) {
  return value?.trim() || ""
}

export function getEmployeePrimaryName(employee: EmployeeNameLike) {
  return normalizeName(employee.socialName) || normalizeName(employee.fullName) || "—"
}

export function getEmployeeLegalName(employee: EmployeeNameLike) {
  const fullName = normalizeName(employee.fullName)
  const socialName = normalizeName(employee.socialName)

  if (!fullName || !socialName) {
    return null
  }

  return fullName.localeCompare(socialName, "pt-BR", { sensitivity: "base" }) === 0 ? null : fullName
}

export function getEmployeeOptionLabel(employee: EmployeeNameLike) {
  const primaryName = getEmployeePrimaryName(employee)
  const legalName = getEmployeeLegalName(employee)

  return legalName ? `${primaryName} | ${legalName}` : primaryName
}
