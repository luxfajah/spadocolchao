import { RawPunch, NormalizedPunch, PunchType, PunchTypeMap, PunchRole, PunchRoleMap } from "./types"

/**
 * Normaliza batidas brutas:
 *  1. Ordena cronologicamente
 *  2. Deduplica (mesmo tipo dentro de 5 min)
 *  3. Atribui PunchType e PunchRole
 *  4. Marca anomalias apenas quando o tipo e realmente desconhecido
 *
 * I/O nao sao invalidados aqui porque a ultima batida do dia pode
 * precisar ser interpretada no calculo conforme o contexto da jornada.
 */
export function normalizePunches(punches: RawPunch[]): NormalizedPunch[] {
  const sorted = [...punches].sort(
    (a, b) => a.dateTime.getTime() - b.dateTime.getTime()
  )

  const results: NormalizedPunch[] = []
  const lastPunchByEmployee: Record<string, NormalizedPunch> = {}

  for (const raw of sorted) {
    const type = PunchTypeMap[raw.rawType] || PunchType.UNKNOWN
    const role = PunchRoleMap[raw.rawType] || PunchRole.UNKNOWN
    const employeeKey = raw.enNo

    const last = lastPunchByEmployee[employeeKey]
    if (last && last.rawType === raw.rawType) {
      const diffMs = raw.dateTime.getTime() - last.dateTime.getTime()
      if (diffMs <= 5 * 60 * 1000) {
        continue
      }
    }

    const normalized: NormalizedPunch = {
      ...raw,
      type,
      role,
      isAnomaly: false,
    }

    if (type === PunchType.UNKNOWN) {
      normalized.isAnomaly = true
      normalized.anomalyType = "UNKNOWN_TYPE"
    }

    results.push(normalized)
    lastPunchByEmployee[employeeKey] = normalized
  }

  return results
}
