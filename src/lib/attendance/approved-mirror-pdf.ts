import { uploadFile } from "@/lib/storage-service"

import { prisma } from "@/lib/prisma"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"
import {
  formatAttendanceDate,
  formatBusinessTime,
} from "@/lib/attendance/business-time"

import { jsPDF } from "jspdf"

export const APPROVED_ATTENDANCE_MIRROR_DOCUMENT_TYPE = "ATTENDANCE_MIRROR"

function formatPeriodLabel(period: string) {
  const match = period.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    return period
  }

  return `${match[2]}/${match[1]}`
}

function sanitizeFileNamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
}

function formatMinutes(minutes: number) {
  const absoluteMinutes = Math.abs(minutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const remainingMinutes = absoluteMinutes % 60
  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`
}

function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return "--:--"
  }

  return formatBusinessTime(new Date(value), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    WORKED_COMPLETE: "Completo",
    WORKED_INCOMPLETE: "Incompleto",
    ABSENT: "Falta",
    WEEKLY_REST: "DSR",
    WEEKLY_REST_WORKED: "DSR Trab.",
    HOLIDAY: "Feriado",
    HOLIDAY_WORKED: "Feriado Trab.",
    ADJUSTED: "Ajustado",
    APPROVED: "Fechado",
    GENERATED: "Gerado",
    EDITING: "Edição",
  }

  return labels[status] || status
}

function drawValueBox(
  pdf: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  valueFontSize = 11
) {
  pdf.setDrawColor(210, 214, 220)
  pdf.roundedRect(x, y, width, height, 2, 2)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(113, 113, 122)
  pdf.text(label.toUpperCase(), x + 3, y + 5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(valueFontSize)
  pdf.setTextColor(15, 23, 42)
  pdf.text(value, x + 3, y + 11)
}

function drawTableHeader(pdf: import("jspdf").jsPDF, y: number) {
  const columns = [
    { label: "Data", x: 10 },
    { label: "Entrada", x: 30 },
    { label: "Saída Alm.", x: 54 },
    { label: "Volta Alm.", x: 79 },
    { label: "Saída", x: 104 },
    { label: "Trabalhado", x: 124 },
    { label: "Extra", x: 149 },
    { label: "Débito", x: 167 },
    { label: "Status", x: 184 },
  ]

  pdf.setFillColor(241, 245, 249)
  pdf.roundedRect(10, y, 190, 8, 1.5, 1.5, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(71, 85, 105)

  for (const column of columns) {
    pdf.text(column.label.toUpperCase(), column.x, y + 5.2)
  }
}

function buildApprovedMirrorPdfBuffer(mirror: any, days: any[]) {
  const pdf = new jsPDF("p", "mm", "a4")
  const pageHeight = pdf.internal.pageSize.getHeight()
  const primaryName = getEmployeePrimaryName(mirror.employee)
  const legalName = getEmployeeLegalName(mirror.employee)
  const generatedAt = new Date()

  const drawDocumentHeader = () => {
    pdf.setFillColor(15, 23, 42)
    pdf.roundedRect(10, 10, 190, 18, 3, 3, "F")
    pdf.setTextColor(255, 255, 255)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(15)
    pdf.text("SPA DO COLCHAO", 14, 18)
    pdf.setFontSize(10)
    pdf.text("ESPELHO DE PONTO APROVADO", 14, 24)

    pdf.setFontSize(8)
    pdf.text(`Emissão: ${generatedAt.toLocaleDateString("pt-BR")}`, 150, 18)
    pdf.text(`Período: ${formatPeriodLabel(mirror.period)}`, 150, 24)

    drawValueBox(pdf, 10, 33, 92, 16, "Colaborador", primaryName)
    drawValueBox(pdf, 108, 33, 92, 16, "Cargo", mirror.employee.jobTitle?.name || "Não informado")

    drawValueBox(
      pdf,
      10,
      53,
      92,
      16,
      "Período tratado",
      `${formatAttendanceDate(mirror.startDate)} a ${formatAttendanceDate(mirror.endDate)}`,
      10
    )
    drawValueBox(pdf, 108, 53, 92, 16, "Escala", mirror.employee.workSchedule?.name || "Não informada", 10)

    if (legalName) {
      drawValueBox(pdf, 10, 73, 190, 12, "Nome legal", legalName, 9)
    }

    const summaryY = legalName ? 89 : 73
    drawValueBox(pdf, 10, summaryY, 44, 14, "Horas esperadas", formatMinutes(mirror.expectedMinutes))
    drawValueBox(pdf, 58, summaryY, 44, 14, "Horas trabalhadas", formatMinutes(mirror.workedMinutes))
    drawValueBox(pdf, 106, summaryY, 44, 14, "Horas extras", formatMinutes(mirror.overtimeMinutes))
    drawValueBox(pdf, 154, summaryY, 46, 14, "Débito", formatMinutes(mirror.deficitMinutes))

    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(8)
    pdf.setTextColor(71, 85, 105)
    pdf.text("Documento oficial para conferência e arquivo funcional.", 10, summaryY + 20)
  }

  drawDocumentHeader()

  let currentY = legalName ? 117 : 101
  drawTableHeader(pdf, currentY)
  currentY += 11

  const rowHeight = 6.7

  for (const day of days) {
    if (currentY > pageHeight - 24) {
      pdf.addPage()
      drawDocumentHeader()
      currentY = legalName ? 117 : 101
      drawTableHeader(pdf, currentY)
      currentY += 11
    }

    pdf.setDrawColor(232, 236, 241)
    pdf.line(10, currentY, 200, currentY)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7.3)
    pdf.setTextColor(15, 23, 42)

    const rowValues = [
      formatAttendanceDate(day.date),
      formatDateTime(day.firstIn),
      formatDateTime(day.lunchOut),
      formatDateTime(day.lunchIn),
      formatDateTime(day.lastOut),
      formatMinutes(day.workedMinutes || 0),
      day.overtimeMinutes > 0 ? `+${formatMinutes(day.overtimeMinutes)}` : "--",
      day.deficitMinutes > 0 ? `-${formatMinutes(day.deficitMinutes)}` : "--",
      getStatusLabel(day.status || ""),
    ]

    const positions = [10, 30, 54, 79, 104, 124, 149, 167, 184]

    rowValues.forEach((value, index) => {
      pdf.text(String(value), positions[index], currentY + 4.4)
    })

    currentY += rowHeight
  }

  const footerY = Math.min(currentY + 8, pageHeight - 34)

  pdf.setDrawColor(210, 214, 220)
  pdf.line(16, footerY + 10, 88, footerY + 10)
  pdf.line(122, footerY + 10, 194, footerY + 10)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(71, 85, 105)
  pdf.text("Responsável pelo fechamento", 31, footerY + 15)
  pdf.text("Assinatura do colaborador", 138, footerY + 15)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.text(
    "Espelho aprovado e arquivado digitalmente no prontuário do colaborador.",
    10,
    pageHeight - 10
  )

  return Buffer.from(pdf.output("arraybuffer"))
}

export async function generateApprovedAttendanceMirrorPdf(mirrorId: string) {
  const mirror = await prisma.attendanceMirror.findUnique({
    where: { id: mirrorId },
    include: {
      employee: {
        include: {
          jobTitle: true,
          workSchedule: true,
        },
      },
      days: {
        orderBy: { date: "asc" },
      },
    },
  })

  if (!mirror) {
    throw new Error("Espelho não encontrado para emissão do PDF.")
  }

  const days =
    mirror.days.length > 0
      ? mirror.days
      : await prisma.attendanceDay.findMany({
          where: {
            employeeId: mirror.employeeId,
            date: {
              gte: mirror.startDate,
              lte: mirror.endDate,
            },
          },
          orderBy: { date: "asc" },
        })

  if (days.length === 0) {
    throw new Error("Não existem dias materializados neste espelho aprovado para gerar o PDF.")
  }

  const periodLabel = formatPeriodLabel(mirror.period)
  const fileName = `${sanitizeFileNamePart(`espelho-ponto-aprovado-${mirror.employeeId}-${mirror.period}-${mirror.id}`)}.pdf`
  const storagePath = `employee-documents/${mirror.employeeId}/attendance-mirrors/${fileName}`
  const fileBuffer = buildApprovedMirrorPdfBuffer(mirror, days)
  
  const fileUrl = await uploadFile(storagePath, fileBuffer)
  const documentName = `Espelho de Ponto Aprovado - ${periodLabel}`
  const description = `Espelho aprovado da competência ${periodLabel}. MirrorId:${mirror.id}`

  const existingDocument = await prisma.employeeDocument.findFirst({
    where: {
      employeeId: mirror.employeeId,
      type: APPROVED_ATTENDANCE_MIRROR_DOCUMENT_TYPE,
      description: {
        contains: `MirrorId:${mirror.id}`,
      },
    },
  })

  const document = existingDocument
    ? await prisma.employeeDocument.update({
        where: { id: existingDocument.id },
        data: {
          name: documentName,
          description,
          fileUrl,
        },
      })
    : await prisma.employeeDocument.create({
        data: {
          employeeId: mirror.employeeId,
          type: APPROVED_ATTENDANCE_MIRROR_DOCUMENT_TYPE,
          name: documentName,
          description,
          fileUrl,
        },
      })

  return {
    documentId: document.id,
    fileUrl,
    employeeId: mirror.employeeId,
    mirrorId: mirror.id,
    period: mirror.period,
    documentName,
  }
}
