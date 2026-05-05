export enum PunchType {
  CLOCK_IN = "CLOCK_IN",
  CLOCK_OUT = "CLOCK_OUT",
  JOB_IN = "JOB_IN",
  JOB_OUT = "JOB_OUT",
  BREAK_START = "BREAK_START",
  BREAK_END = "BREAK_END",
  UNKNOWN = "UNKNOWN"
}

/**
 * Role semântico da batida na jornada diária.
 * Mapeia diretamente os códigos do relógio de ponto:
 *   S → Entrada manhã
 *   E → Saída almoço
 *   A → Retorno almoço
 *   F → Saída final
 *   I/O → Pausa/break (não conta como jornada principal)
 */
export enum PunchRole {
  ENTRY_MORNING = "ENTRY_MORNING",     // S
  EXIT_LUNCH = "EXIT_LUNCH",           // E
  RETURN_LUNCH = "RETURN_LUNCH",       // A
  EXIT_FINAL = "EXIT_FINAL",           // F
  BREAK = "BREAK",                     // I, O
  UNKNOWN = "UNKNOWN"
}

export enum AttendanceStatus {
  WORKED_COMPLETE = "WORKED_COMPLETE",
  WORKED_INCOMPLETE = "WORKED_INCOMPLETE",
  ABSENT = "ABSENT",
  WEEKLY_REST = "WEEKLY_REST",
  WEEKLY_REST_WORKED = "WEEKLY_REST_WORKED",
  HOLIDAY = "HOLIDAY",
  HOLIDAY_WORKED = "HOLIDAY_WORKED",
  VACATION = "VACATION",
  LEAVE = "LEAVE",
  NO_SCHEDULE = "NO_SCHEDULE",
  ADJUSTED = "ADJUSTED"
}

export const PunchTypeMap: Record<string, PunchType> = {
  "S": PunchType.CLOCK_IN,
  "E": PunchType.CLOCK_OUT,
  "A": PunchType.JOB_IN,
  "F": PunchType.JOB_OUT,
  "I": PunchType.BREAK_START,
  "O": PunchType.BREAK_END,
};

/** Mapeia o rawType (código do relógio) → role semântico na jornada */
export const PunchRoleMap: Record<string, PunchRole> = {
  "S": PunchRole.ENTRY_MORNING,
  "E": PunchRole.EXIT_LUNCH,
  "A": PunchRole.RETURN_LUNCH,
  "F": PunchRole.EXIT_FINAL,
  "I": PunchRole.BREAK,
  "O": PunchRole.BREAK,
};

export interface RawPunch {
  enNo: string;
  dateTime: Date;
  rawType: string;
}

export interface NormalizedPunch extends RawPunch {
  type: PunchType;
  role: PunchRole;
  isAnomaly?: boolean;
  anomalyType?: string;
}

export interface AttendanceDayResult {
  date: Date;
  expectedMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  deficitMinutes: number;
  firstIn: Date | null;
  lunchOut: Date | null;
  lunchIn: Date | null;
  lastOut: Date | null;
  status: AttendanceStatus;
  anomalies: string[];
  observations: string[];
  isHoliday?: boolean;
  holidayName?: string;
}

export interface AttendanceMirrorResult {
  employeeId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  expectedMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  deficitMinutes: number;
  days: AttendanceDayResult[];
}

export interface FileAnalysisResult {
  employees: {
    pointMachineId: string;
    name?: string;
    recordsCount: number;
    startDate: Date;
    endDate: Date;
  }[];
  startDate: Date;
  endDate: Date;
}
