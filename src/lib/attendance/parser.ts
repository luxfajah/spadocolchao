import { RawPunch } from "./types"
import { createInstantFromBusinessDateTime } from "./business-time"

/**
 * Detects if a buffer is UTF-16LE encoded.
 */
function isUtf16Le(buffer: Buffer): boolean {
  if (buffer.length < 2) return false
  // Check for Byte Order Mark (BOM) for UTF-16LE
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return true
  // Heuristic: check if every second byte is zero (common in ASCII text saved as UTF-16LE)
  let zeroCount = 0
  for (let i = 1; i < Math.min(buffer.length, 100); i += 2) {
    if (buffer[i] === 0) zeroCount++
  }
  return zeroCount > Math.min(buffer.length, 100) / 4
}

export function parsePunchTxt(buffer: Buffer): RawPunch[] {
  let content: string

  if (isUtf16Le(buffer)) {
    content = buffer.toString("utf16le")
  } else {
    content = buffer.toString("utf8")
  }

  // Remove potential BOM character from the start of the string
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1)
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  // Analyze header
  const firstLine = lines[0].split("\t")
  const enNoIdx = firstLine.findIndex((h) => h.trim().toLowerCase() === "enno")
  const dateTimeIdx = firstLine.findIndex(
    (h) => h.trim().toLowerCase() === "datetime"
  )
  const typeIdx = firstLine.findIndex(
    (h) => h.trim().toLowerCase() === "in/out"
  )

  let startIndex = 1
  let colEnNo = enNoIdx
  let colDateTime = dateTimeIdx
  let colType = typeIdx

  // Default indices based on: No, TMNo, EnNo, Name, GMNo, Mode, IN/OUT, Antipass, DaiGong, DateTime, TR
  // No(0), TMNo(1), EnNo(2), Name(3), GMNo(4), Mode(5), IN/OUT(6), Antipass(7), DaiGong(8), DateTime(9), TR(10)
  if (enNoIdx === -1 || dateTimeIdx === -1) {
    colEnNo = 2
    colType = 6
    colDateTime = 9
    // If the first line looks like data (e.g. EnNo is a number), assume no header
    if (!isNaN(Number(firstLine[2]))) {
      startIndex = 0
    }
  }

  const results: RawPunch[] = []

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split("\t")
    const maxIdx = Math.max(colEnNo, colDateTime, colType)
    if (cols.length <= maxIdx) continue

    const enNo = cols[colEnNo]?.trim()
    const dateTimeStr = cols[colDateTime]?.trim()
    const rawType = cols[colType]?.trim()

    if (!enNo || !dateTimeStr) continue

    // Robust date/time parsing
    let dateObj: Date | null = null
    const parts = dateTimeStr.split(/[\s/:-]+/).filter(p => p.length > 0)
    
    if (parts.length >= 3) {
      let year, month, day, hour = 0, minute = 0, second = 0
      
      // Check format: YYYY-MM-DD or DD/MM/YYYY
      if (parts[0].length === 4) {
        // YYYY MM DD
        year = parseInt(parts[0])
        month = parseInt(parts[1])
        day = parseInt(parts[2])
        hour = parseInt(parts[3] || "0")
        minute = parseInt(parts[4] || "0")
        second = parseInt(parts[5] || "0")
      } else {
        // DD MM YYYY
        day = parseInt(parts[0])
        month = parseInt(parts[1])
        year = parseInt(parts[2])
        hour = parseInt(parts[3] || "0")
        minute = parseInt(parts[4] || "0")
        second = parseInt(parts[5] || "0")
      }
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        dateObj = createInstantFromBusinessDateTime(year, month, day, hour, minute, second)
      }
    }

    if (!dateObj || isNaN(dateObj.getTime())) continue

    results.push({
      enNo,
      dateTime: dateObj,
      rawType: rawType || "S",
    })
  }

  return results
}

export function analyzePunches(rawPunches: RawPunch[]) {
  const employeeMap: Record<string, { pointMachineId: string; recordsCount: number; minDate: Date; maxDate: Date }> = {}
  let minDate = new Date(8640000000000000)
  let maxDate = new Date(-8640000000000000)

  for (const p of rawPunches) {
    if (!employeeMap[p.enNo]) {
      employeeMap[p.enNo] = {
        pointMachineId: p.enNo,
        recordsCount: 0,
        minDate: p.dateTime,
        maxDate: p.dateTime
      }
    }
    const emp = employeeMap[p.enNo]
    emp.recordsCount++
    if (p.dateTime < emp.minDate) emp.minDate = p.dateTime
    if (p.dateTime > emp.maxDate) emp.maxDate = p.dateTime

    if (p.dateTime < minDate) minDate = p.dateTime
    if (p.dateTime > maxDate) maxDate = p.dateTime
  }

  return {
    employees: Object.values(employeeMap).map(e => ({
      pointMachineId: e.pointMachineId,
      recordsCount: e.recordsCount,
      startDate: e.minDate,
      endDate: e.maxDate
    })),
    startDate: minDate,
    endDate: maxDate
  }
}
