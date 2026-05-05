/**
 * Sistema de Feriados — Spa do Colchão
 * Sede: Foz do Iguaçu, PR
 * 
 * Feriados que realmente fecham comércio na região.
 * Fonte: calendário municipal de Foz do Iguaçu + feriados nacionais obrigatórios.
 */

export interface HolidayEntry {
  date: string  // "MM-DD" para fixos, "YYYY-MM-DD" para móveis
  name: string
  type: "NATIONAL" | "STATE" | "MUNICIPAL"
  closesCommerce: boolean  // true = comércio fecha, abonar automaticamente
}

/**
 * Feriados fixos nacionais que fecham comércio.
 * Formato: MM-DD
 */
export const FIXED_NATIONAL_HOLIDAYS: HolidayEntry[] = [
  { date: "01-01", name: "Confraternização Universal", type: "NATIONAL", closesCommerce: true },
  { date: "04-21", name: "Tiradentes", type: "NATIONAL", closesCommerce: true },
  { date: "05-01", name: "Dia do Trabalho", type: "NATIONAL", closesCommerce: true },
  { date: "09-07", name: "Independência do Brasil", type: "NATIONAL", closesCommerce: true },
  { date: "10-12", name: "Nossa Sra. Aparecida", type: "NATIONAL", closesCommerce: true },
  { date: "11-02", name: "Finados", type: "NATIONAL", closesCommerce: true },
  { date: "11-15", name: "Proclamação da República", type: "NATIONAL", closesCommerce: true },
  { date: "12-25", name: "Natal", type: "NATIONAL", closesCommerce: true },
]

/**
 * Feriado municipal de Foz do Iguaçu
 */
export const MUNICIPAL_HOLIDAYS: HolidayEntry[] = [
  { date: "06-10", name: "Aniversário de Foz do Iguaçu", type: "MUNICIPAL", closesCommerce: true },
]

/**
 * Feriados móveis (Páscoa-dependentes) — pré-calculados para vários anos.
 * Carnaval (terça) e Corpus Christi normalmente têm ponto facultativo 
 * mas comércio pode ou não fechar; Sexta-feira Santa fecha.
 */
const MOVEABLE_HOLIDAYS: Record<number, { date: string; name: string }[]> = {
  2024: [
    { date: "2024-02-13", name: "Carnaval" },
    { date: "2024-03-29", name: "Sexta-feira Santa" },
    { date: "2024-05-30", name: "Corpus Christi" },
  ],
  2025: [
    { date: "2025-03-04", name: "Carnaval" },
    { date: "2025-04-18", name: "Sexta-feira Santa" },
    { date: "2025-06-19", name: "Corpus Christi" },
  ],
  2026: [
    { date: "2026-02-17", name: "Carnaval" },
    { date: "2026-04-03", name: "Sexta-feira Santa" },
    { date: "2026-06-04", name: "Corpus Christi" },
  ],
  2027: [
    { date: "2027-02-09", name: "Carnaval" },
    { date: "2027-03-26", name: "Sexta-feira Santa" },
    { date: "2027-05-27", name: "Corpus Christi" },
  ],
  2028: [
    { date: "2028-02-29", name: "Carnaval" },
    { date: "2028-04-14", name: "Sexta-feira Santa" },
    { date: "2028-06-15", name: "Corpus Christi" },
  ],
}

export interface ResolvedHoliday {
  date: string   // "YYYY-MM-DD"
  name: string
  type: "NATIONAL" | "STATE" | "MUNICIPAL" | "MOVEABLE"
  closesCommerce: boolean
}

/**
 * Retorna todos os feriados que fecham comércio para um dado ano.
 * Combina feriados fixos + municipais + móveis.
 */
export function getHolidaysForYear(year: number): ResolvedHoliday[] {
  const holidays: ResolvedHoliday[] = []

  // Feriados fixos nacionais
  for (const h of FIXED_NATIONAL_HOLIDAYS) {
    if (h.closesCommerce) {
      holidays.push({
        date: `${year}-${h.date}`,
        name: h.name,
        type: h.type,
        closesCommerce: true,
      })
    }
  }

  // Feriados municipais (Foz do Iguaçu)
  for (const h of MUNICIPAL_HOLIDAYS) {
    if (h.closesCommerce) {
      holidays.push({
        date: `${year}-${h.date}`,
        name: h.name,
        type: h.type,
        closesCommerce: true,
      })
    }
  }

  // Feriados móveis
  const moveable = MOVEABLE_HOLIDAYS[year]
  if (moveable) {
    for (const h of moveable) {
      holidays.push({
        date: h.date,
        name: h.name,
        type: "MOVEABLE",
        closesCommerce: true,
      })
    }
  }

  return holidays
}

/**
 * Retorna feriados que cobrem um período de datas (pode cruzar anos).
 * Retorna um Map: "YYYY-MM-DD" → ResolvedHoliday para lookup O(1).
 */
export function getHolidaysForRange(startDate: Date, endDate: Date): Map<string, ResolvedHoliday> {
  const map = new Map<string, ResolvedHoliday>()

  const startYear = startDate.getUTCFullYear()
  const endYear = endDate.getUTCFullYear()

  for (let y = startYear; y <= endYear; y++) {
    const holidays = getHolidaysForYear(y)
    for (const h of holidays) {
      map.set(h.date, h)
    }
  }

  return map
}

/**
 * Formata uma data UTC como "YYYY-MM-DD" para lookup no mapa de feriados.
 */
export function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
