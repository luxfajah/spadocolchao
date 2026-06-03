import { PunchType } from "@/lib/attendance/types"

export const APP_PUNCH_TYPES = [
  { label: "Entrada", rawType: "S", type: PunchType.CLOCK_IN },
  { label: "Saída Almoço", rawType: "E", type: PunchType.CLOCK_OUT },
  { label: "Retorno Almoço", rawType: "A", type: PunchType.JOB_IN },
  { label: "Saída Final", rawType: "F", type: PunchType.JOB_OUT },
]
