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

  const results: RawPunch[] = []

  // Check if it's an AFD file (Brazilian Standard Portaria 1510/373/671)
  // AFD lines usually start with a 9-digit sequence number (NSR)
  // Punch records are Type 3: NSR (9) + Type (1) + Date (8: DDMMYYYY) + Time (4: HHMM) + PIS/ID (11) = 33 chars minimum
  const isAFD = lines.some(line => line.length >= 33 && /^\d{9}3\d{8}\d{4}/.test(line))
  if (isAFD) {
    for (const line of lines) {
      if (line.length >= 33 && /^\d{9}3\d{8}\d{4}/.test(line)) {
        const dateStr = line.substring(10, 18) // DDMMYYYY
        const timeStr = line.substring(18, 22) // HHMM
        const pis = line.substring(22, 33).trim() // ID do funcionário

        const day = parseInt(dateStr.substring(0, 2))
        const month = parseInt(dateStr.substring(2, 4))
        const year = parseInt(dateStr.substring(4, 8))
        const hour = parseInt(timeStr.substring(0, 2))
        const minute = parseInt(timeStr.substring(2, 4))

        const dateObj = createInstantFromBusinessDateTime(year, month, day, hour, minute, 0)
        if (dateObj && !isNaN(dateObj.getTime())) {
          results.push({
            enNo: pis, // O PIS ou ID serve como identificador
            dateTime: dateObj,
            rawType: "S" // Generic punch
          })
        }
      }
    }
    if (results.length > 0) return results
  }

  // Filtrar metadados (linhas que começam com '#')
  const dataLines = lines.filter(line => !line.trim().startsWith("#"))
  if (dataLines.length === 0) {
    const firstFewLines = lines.slice(0, 3).join(" | ")
    throw new Error(`O arquivo parece conter apenas metadados. Linhas iniciais: ${firstFewLines.substring(0, 150)}`)
  }

  // Detect delimiter for CSV/TSV formats
  let delimiter = "\t"
  const firstLineTabs = dataLines[0].split("\t").length
  const firstLineSemis = dataLines[0].split(";").length
  const firstLineCommas = dataLines[0].split(",").length

  if (firstLineSemis > firstLineTabs && firstLineSemis > firstLineCommas) {
    delimiter = ";"
  } else if (firstLineCommas > firstLineTabs && firstLineCommas > firstLineSemis) {
    delimiter = ","
  }

  // Analyze header
  const firstLine = dataLines[0].split(delimiter)
  
  // Find columns based on common names
  let enNoIdx = firstLine.findIndex((h) => {
    const text = h.trim().toLowerCase().replace(/["']/g, "")
    return text === "enno" || text === "pis" || text === "matrícula" || text === "matricula" || text === "pin" || text === "id"
  })

  // Fallback to "No" only if specific IDs are not found
  if (enNoIdx === -1) {
    enNoIdx = firstLine.findIndex((h) => h.trim().toLowerCase().replace(/["']/g, "") === "no")
  }
  
  const dateTimeIdx = firstLine.findIndex((h) => {
    const text = h.trim().toLowerCase().replace(/["']/g, "")
    return text === "datetime" || text === "data/hora" || text === "data e hora" || text === "time" || text === "hora" || text === "data" || text === "datahora"
  })

  // Separated date and time?
  let dateIdx = -1
  let timeIdx = -1
  if (dateTimeIdx === -1) {
    dateIdx = firstLine.findIndex(h => {
      const text = h.trim().toLowerCase().replace(/["']/g, "")
      return text === "data" || text === "date"
    })
    timeIdx = firstLine.findIndex(h => {
      const text = h.trim().toLowerCase().replace(/["']/g, "")
      return text === "hora" || text === "time"
    })
  }
  
  const typeIdx = firstLine.findIndex((h) => {
    const text = h.trim().toLowerCase().replace(/["']/g, "")
    return text === "in/out" || text === "tipo" || text === "status"
  })

  let startIndex = 1
  let colEnNo = enNoIdx
  let colDateTime = dateTimeIdx
  let colType = typeIdx

  // Default indices if no valid header is found
  if (enNoIdx === -1) {
    // If it looks like ZKTeco default (has at least 10 cols, first and third are numbers)
    if (firstLine.length >= 10 && !isNaN(Number(firstLine[0])) && !isNaN(Number(firstLine[2]))) {
      colEnNo = 2
      colType = 6
      colDateTime = 9
      if (!isNaN(Number(firstLine[2]))) startIndex = 0
    } else if (firstLine.length >= 2) {
      // Just try to find a number column that looks like an ID, and a datetime column
      colEnNo = 0 // Try first column as ID
      colDateTime = 1 // Try second column as Date
      startIndex = 0
    }
  }

  for (let i = startIndex; i < dataLines.length; i++) {
    const cols = dataLines[i].split(delimiter)
    
    // Attempt to extract values using detected indices or fallback
    let enNo = ""
    if (colEnNo >= 0 && colEnNo < cols.length) enNo = cols[colEnNo]?.trim()
    
    let dateTimeStr = ""
    if (colDateTime >= 0 && colDateTime < cols.length) {
      dateTimeStr = cols[colDateTime]?.trim()
    } else if (dateIdx >= 0 && timeIdx >= 0 && dateIdx < cols.length && timeIdx < cols.length) {
      dateTimeStr = `${cols[dateIdx]?.trim()} ${cols[timeIdx]?.trim()}`
    } else if (cols.length >= 2 && colEnNo === 0 && colDateTime === 1) {
      enNo = cols[0]?.trim()
      dateTimeStr = cols[1]?.trim()
    }

    const rawType = (colType >= 0 && colType < cols.length) ? cols[colType]?.trim() : "S"

    if (!enNo || !dateTimeStr) continue

    // Remove quotes
    enNo = enNo.replace(/^"|"$/g, '')
    dateTimeStr = dateTimeStr.replace(/^"|"$/g, '')

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
        // DD MM YYYY or MM DD YYYY
        // In Brazil, usually DD MM YYYY
        day = parseInt(parts[0])
        month = parseInt(parts[1])
        year = parseInt(parts[2])
        hour = parseInt(parts[3] || "0")
        minute = parseInt(parts[4] || "0")
        second = parseInt(parts[5] || "0")
      }
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Ensure year is 4 digits
        if (year < 100) year += 2000
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

  // If we still found no records, throw an informative error
  if (results.length === 0) {
    const firstFewLines = lines.slice(0, 3).join(" | ")
    throw new Error(`Formato de arquivo não suportado. Linhas iniciais: ${firstFewLines.substring(0, 150)}`)
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
