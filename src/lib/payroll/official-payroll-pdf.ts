import { uploadFile } from "@/lib/storage-service"

import { prisma } from "@/lib/prisma"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"
import { extractAttendanceMirrorId } from "@/lib/payroll/attendance-mirror"
import {
  extractPayrollAllocationSnapshot,
  resolveEmployeePayrollAllocation,
} from "@/lib/payroll/allocation"
import {
  calculatePayrollBenefitBreakdown,
  calculatePayrollValuesByPeriod,
  getPayrollTaxPolicySummary,
} from "@/lib/payroll/tax-policy"

const { jsPDF } = require("jspdf") as typeof import("jspdf")

export const PAYROLL_DOCUMENT_TYPE = "PAYROLL"



type RubricaLine = {
  code: string
  description: string
  reference: string
  amount: number
}

function getRubricaTableHeight(rows: RubricaLine[]) {
  return 26 + Math.max(rows.length, 1) * 8
}

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(value?: Date | string | null) {
  if (!value) {
    return "--"
  }

  return new Date(value).toLocaleDateString("pt-BR")
}

function formatCpf(value?: string | null) {
  if (!value) {
    return "--"
  }

  const digits = value.replace(/\D/g, "")
  if (digits.length !== 11) {
    return value
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatDocumentValue(value?: string | null) {
  return value?.trim() || "--"
}

function formatMinutes(minutes?: number | null) {
  if (!minutes) {
    return "0h00"
  }

  const absoluteMinutes = Math.abs(minutes)
  const hours = Math.floor(absoluteMinutes / 60)
  const remainingMinutes = absoluteMinutes % 60

  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`
}

function fitSingleLineText(
  pdf: import("jspdf").jsPDF,
  value: string,
  maxWidth: number
) {
  const sanitizedValue = value || "--"

  if (pdf.getTextWidth(sanitizedValue) <= maxWidth) {
    return sanitizedValue
  }

  let trimmedValue = sanitizedValue

  while (trimmedValue.length > 3 && pdf.getTextWidth(`${trimmedValue}...`) > maxWidth) {
    trimmedValue = trimmedValue.slice(0, -1).trimEnd()
  }

  return `${trimmedValue}...`
}

function buildEarnings(payroll: any, employee: any, mirror: any | null) {
  const benefitBreakdown = calculatePayrollBenefitBreakdown({
    salaryBase: employee.salaryBase,
    transportationAllowance: employee.transportationAllowance,
    transportationPayrollDeductionEnabled: employee.transportationPayrollDeductionEnabled,
    transportationPayrollDeductionPercent: employee.transportationPayrollDeductionPercent,
    foodAllowance: employee.foodAllowance,
    foodPayrollDeductionEnabled: employee.foodPayrollDeductionEnabled,
    foodPayrollDeductionPercent: employee.foodPayrollDeductionPercent,
    fuelAllowance: employee.fuelAllowance,
  })

  const lines: RubricaLine[] = [
    {
      code: "1001",
      description: "Salário base",
      reference: "30 dias",
      amount: payroll.grossSalary || 0,
    },
  ]

  // Horas extras calculadas diretamente do espelho vinculado
  const overtimeMinutes = mirror?.overtimeMinutes || 0
  if (overtimeMinutes > 0 && employee.salaryBase) {
    const hourlyRate = employee.salaryBase / 220
    const overtimeRate = hourlyRate * 1.5
    const overtimeAmount = (overtimeMinutes / 60) * overtimeRate
    if (overtimeAmount > 0) {
      lines.push({
        code: "1002",
        description: "Horas Extras (50%)",
        reference: `${Math.floor(overtimeMinutes / 60)}h${(overtimeMinutes % 60).toString().padStart(2, "0")}`,
        amount: overtimeAmount,
      })
    }
  }

  // Benefícios/proventos com valores reais
  const benefitLines = [
    { code: "1601", description: "Vale transporte", amount: benefitBreakdown.transportationBenefit || 0 },
    { code: "1602", description: "Alimentação cedida na empresa", amount: benefitBreakdown.foodBenefit || 0 },
    { code: "1606", description: "Auxílio gasolina / diesel", amount: benefitBreakdown.fuelBenefit || 0 },
    { code: "1603", description: "Bônus assiduidade", amount: Number(employee.attendanceBonusAmount || employee.attendanceBonus || 0) },
    { code: "1604", description: "Auxílio farmácia", amount: Number(employee.pharmacyAllowance || 0) },
    { code: "1605", description: "Auxílio creche", amount: Number(employee.childcareAllowance || 0) },
  ]

  for (const item of benefitLines) {
    if (item.amount > 0) {
      lines.push({
        code: item.code,
        description: item.description,
        reference: "--",
        amount: item.amount,
      })
    }
  }

  // Calcula o total de proventos já detalhados (excluindo salário base)
  const detailedTotal = lines.slice(1).reduce((sum, l) => sum + l.amount, 0)
  const otherAdditions = Number(payroll.otherAdditions || 0)
  const residual = otherAdditions - detailedTotal

  // Só exibe "Outras verbas" se houver valor residual não explicado
  if (residual > 0.01) {
    lines.push({
      code: "1699",
      description: "Outras verbas",
      reference: "--",
      amount: residual,
    })
  }

  return lines.filter((line) => line.amount > 0)
}


function buildDeductions(payroll: any, employee: any) {
  const benefitBreakdown = calculatePayrollBenefitBreakdown({
    salaryBase: employee.salaryBase,
    transportationAllowance: employee.transportationAllowance,
    transportationPayrollDeductionEnabled: employee.transportationPayrollDeductionEnabled,
    transportationPayrollDeductionPercent: employee.transportationPayrollDeductionPercent,
    foodAllowance: employee.foodAllowance,
    foodPayrollDeductionEnabled: employee.foodPayrollDeductionEnabled,
    foodPayrollDeductionPercent: employee.foodPayrollDeductionPercent,
    fuelAllowance: employee.fuelAllowance,
  })
  const payrollValues = calculatePayrollValuesByPeriod({
    period: payroll.referencePeriod,
    grossSalary: payroll.grossSalary || 0,
    otherAdditions: benefitBreakdown.totalAdditions,
    otherDeductions: benefitBreakdown.totalDeductions,
  })
  const lines: RubricaLine[] = [
    {
      code: "4101",
      description: "INSS",
      reference: payrollValues.taxPolicy.inss.referenceLabel,
      amount: payroll.inss || 0,
    },
    {
      code: "4201",
      description: "IRRF",
      reference: payrollValues.taxPolicy.irrf.referenceLabel,
      amount: payroll.irrf || 0,
    },
  ]

  if (benefitBreakdown.transportationDeduction > 0) {
    lines.push({
      code: "4301",
      description: "Desconto vale transporte",
      reference: `${benefitBreakdown.transportationDeductionPercent.toFixed(2).replace(".", ",")}%`,
      amount: benefitBreakdown.transportationDeduction,
    })
  }

  if (benefitBreakdown.foodDeduction > 0) {
    lines.push({
      code: "4302",
      description: "Desconto alimentação cedida",
      reference: `${benefitBreakdown.foodDeductionPercent.toFixed(2).replace(".", ",")}%`,
      amount: benefitBreakdown.foodDeduction,
    })
  }

  const residualOtherDeductions =
    Number(payroll.otherDeductions || 0) -
    benefitBreakdown.transportationDeduction -
    benefitBreakdown.foodDeduction

  if (residualOtherDeductions > 0) {
    lines.push({
      code: "4999",
      description: "Outros descontos",
      reference: "--",
      amount: residualOtherDeductions,
    })
  }

  return lines.filter((line) => line.amount > 0)
}

function drawField(
  pdf: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
) {
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text(label.toUpperCase(), x, y)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9.5)
  pdf.setTextColor(15, 23, 42)
  pdf.text(fitSingleLineText(pdf, value, width), x, y + 5)
  pdf.setDrawColor(226, 232, 240)
  pdf.line(x, y + 7.4, x + width, y + 7.4)
}

function drawSectionTitle(pdf: import("jspdf").jsPDF, y: number, title: string) {
  pdf.setFillColor(241, 245, 249)
  pdf.roundedRect(10, y, 190, 8, 1.5, 1.5, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(51, 65, 85)
  pdf.text(title.toUpperCase(), 14, y + 5.2)
}

function drawRubricaTable(
  pdf: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  rows: RubricaLine[],
  highlight: { r: number; g: number; b: number }
) {
  pdf.setFillColor(highlight.r, highlight.g, highlight.b)
  pdf.roundedRect(x, y, width, 8, 1.5, 1.5, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.5)
  pdf.setTextColor(255, 255, 255)
  pdf.text(title.toUpperCase(), x + 3, y + 5.2)

  pdf.setFillColor(248, 250, 252)
  pdf.rect(x, y + 10, width, 7, "F")
  pdf.setFontSize(6.4)
  pdf.setTextColor(71, 85, 105)
  pdf.text("COD.", x + 3, y + 14.4)
  pdf.text("RUBRICA", x + 16, y + 14.4)
  pdf.text("REF.", x + width - 30, y + 14.4)
  pdf.text("VALOR", x + width - 14, y + 14.4, { align: "right" })

  let currentY = y + 20

  if (rows.length === 0) {
    pdf.setDrawColor(226, 232, 240)
    pdf.rect(x, currentY - 3, width, 8)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7)
    pdf.setTextColor(148, 163, 184)
    pdf.text("Sem lançamentos.", x + 3, currentY + 2)
    currentY += 8
  } else {
    for (const row of rows) {
      pdf.setDrawColor(226, 232, 240)
      pdf.rect(x, currentY - 3, width, 8)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.setTextColor(15, 23, 42)
      pdf.text(row.code, x + 3, currentY + 2)
      pdf.text(row.description, x + 16, currentY + 2)
      pdf.text(row.reference || "--", x + width - 30, currentY + 2)
      pdf.text(formatCurrency(row.amount), x + width - 3, currentY + 2, { align: "right" })
      currentY += 8
    }
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  pdf.setFillColor(241, 245, 249)
  pdf.rect(x, currentY - 2, width, 8, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.2)
  pdf.setTextColor(30, 41, 59)
  pdf.text("TOTAL", x + 3, currentY + 2.5)
  pdf.text(formatCurrency(total), x + width - 3, currentY + 2.5, { align: "right" })
}

function drawObservationBox(
  pdf: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  value: string
) {
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  const lines = pdf.splitTextToSize(value || "--", width - 8) as string[]
  const boxHeight = Math.max(14, 8 + lines.length * 4.2)

  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(x, y, width, boxHeight, 2, 2, "FD")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(71, 85, 105)
  pdf.text(title.toUpperCase(), x + 4, y + 4.8)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.setTextColor(15, 23, 42)
  pdf.text(lines, x + 4, y + 9.5)

  return boxHeight
}

function drawDivider(pdf: import("jspdf").jsPDF, y: number) {
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.3)
  pdf.line(10, y, 200, y)
  pdf.setLineWidth(0.2)
}

function drawInfoCard(
  pdf: import("jspdf").jsPDF,
  x: number, y: number, width: number,
  label: string, value: string,
  accent?: { r: number; g: number; b: number }
) {
  pdf.setFillColor(248, 250, 252)
  pdf.roundedRect(x, y, width, 13, 1.5, 1.5, "F")
  if (accent) {
    pdf.setFillColor(accent.r, accent.g, accent.b)
    pdf.roundedRect(x, y, 2, 13, 0.5, 0.5, "F")
  }
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6)
  pdf.setTextColor(148, 163, 184)
  pdf.text(label.toUpperCase(), x + 4, y + 4.5)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8.5)
  pdf.setTextColor(15, 23, 42)
  pdf.text(fitSingleLineText(pdf, value, width - 6), x + 4, y + 10.5)
}

function buildPayrollPdfBuffer(payroll: any, mirror: any | null, companyName: string, companyCnpj: string) {
  const pdf = new jsPDF("p", "mm", "a4")
  const employee = payroll.employee
  const primaryName = getEmployeePrimaryName(employee)
  const legalName = getEmployeeLegalName(employee)
  const storedAllocationSnapshot = extractPayrollAllocationSnapshot(payroll)
  const employeeAllocationSnapshot = resolveEmployeePayrollAllocation(employee)
  const allocationSnapshot = {
    costCenterName: storedAllocationSnapshot.costCenterName || employeeAllocationSnapshot.costCenterName,
    sectorName: storedAllocationSnapshot.sectorName || employeeAllocationSnapshot.sectorName,
  }
  const issueDate = new Date()
  const earnings = buildEarnings(payroll, employee, mirror)
  const deductions = buildDeductions(payroll, employee)
  const grossWithAdditions = Number(payroll.grossSalary || 0) + Number(payroll.otherAdditions || 0)
  const totalDeductions = Number(payroll.inss || 0) + Number(payroll.irrf || 0) + Number(payroll.otherDeductions || 0)
  const paymentDueDate = payroll.accountsPayable?.[0]?.dueDate
  const taxPolicy = getPayrollTaxPolicySummary(payroll.referencePeriod)

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Dark gradient-style header
  pdf.setFillColor(15, 23, 42)
  pdf.rect(0, 0, 210, 32, "F")
  // Left accent bar
  pdf.setFillColor(16, 185, 129)
  pdf.rect(0, 0, 3, 32, "F")

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(16)
  pdf.setTextColor(255, 255, 255)
  pdf.text(companyName.toUpperCase(), 8, 13)

  pdf.setFontSize(7.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text("RECIBO DE PAGAMENTO DE SALÁRIO", 8, 20)
  pdf.text(companyCnpj, 8, 26)

  // Right info block
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.setTextColor(148, 163, 184)
  pdf.text("EMISSÃO", 150, 11)
  pdf.text("COMPETÊNCIA", 150, 20)
  pdf.text("SITUAÇÃO", 150, 29)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(255, 255, 255)
  pdf.text(formatDate(issueDate), 178, 11)
  pdf.text(formatPeriodLabel(payroll.referencePeriod), 178, 20)
  pdf.setTextColor(16, 185, 129)
  pdf.text("PROCESSADO", 178, 29)

  // ── IDENTIFICATION ──────────────────────────────────────────────────────────
  let y = 38

  // Employee name — large prominent
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(13)
  pdf.setTextColor(15, 23, 42)
  pdf.text(primaryName, 10, y + 6)
  if (legalName) {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(7.5)
    pdf.setTextColor(100, 116, 139)
    pdf.text(`Nome legal: ${legalName}`, 10, y + 12)
    y += 4
  }
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.setTextColor(71, 85, 105)
  pdf.text(employee.jobTitle?.name || "Cargo não informado", 10, y + 18)

  y += 24
  drawDivider(pdf, y)
  y += 5

  // Info cards row 1: CPF, Matrícula, Admissão, Contrato
  const card1w = 44
  drawInfoCard(pdf, 10, y, card1w, "CPF", formatCpf(employee.cpf), { r: 59, g: 130, b: 246 })
  drawInfoCard(pdf, 57, y, card1w, "Matrícula", formatDocumentValue(employee.code || employee.serialId?.toString() || employee.pointMachineId), { r: 139, g: 92, b: 246 })
  drawInfoCard(pdf, 104, y, card1w, "Admissão", formatDate(employee.admissionDate), { r: 249, g: 115, b: 22 })
  drawInfoCard(pdf, 151, y, 49, "Contrato", formatDocumentValue(employee.contractType), { r: 20, g: 184, b: 166 })

  y += 17
  // Info cards row 2: Centro de custo, Setor, PIS
  drawInfoCard(pdf, 10, y, 59, "Centro de custo", allocationSnapshot.costCenterName || "Não informado", { r: 16, g: 185, b: 129 })
  drawInfoCard(pdf, 72, y, 81, "Setor / Função", allocationSnapshot.sectorName || "Não informado", { r: 16, g: 185, b: 129 })
  drawInfoCard(pdf, 156, y, 44, "PIS / PASEP", formatDocumentValue(employee.pis), { r: 100, g: 116, b: 139 })

  y += 20
  drawDivider(pdf, y)
  y += 4

  // ── SECTION TITLE ──────────────────────────────────────────────────────────
  pdf.setFillColor(15, 23, 42)
  pdf.roundedRect(10, y, 190, 7, 1.5, 1.5, "F")
  pdf.setFillColor(16, 185, 129)
  pdf.roundedRect(10, y, 2.5, 7, 0.5, 0.5, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.5)
  pdf.setTextColor(255, 255, 255)
  pdf.text("DEMONSTRATIVO FINANCEIRO", 15, y + 4.8)

  y += 11

  // ── EARNINGS TABLE ─────────────────────────────────────────────────────────
  const tableW = 92
  drawRubricaTable(pdf, 10, y, tableW, "Proventos", earnings, { r: 16, g: 185, b: 129 })
  drawRubricaTable(pdf, 108, y, tableW, "Descontos", deductions, { r: 37, g: 99, b: 235 })

  const tablesHeight = Math.max(getRubricaTableHeight(earnings), getRubricaTableHeight(deductions))
  y += tablesHeight + 8

  // ── LIQUID NET HIGHLIGHT ────────────────────────────────────────────────────
  // Three totals side by side
  drawInfoCard(pdf, 10, y, 57, "Base Bruta (Salário)", formatCurrency(payroll.grossSalary || 0), { r: 100, g: 116, b: 139 })
  drawInfoCard(pdf, 70, y, 57, "Total Proventos", formatCurrency(grossWithAdditions), { r: 59, g: 130, b: 246 })
  drawInfoCard(pdf, 130, y, 57, "Total Descontos", formatCurrency(totalDeductions), { r: 239, g: 68, b: 68 })

  y += 17

  // Net salary — big green box
  pdf.setFillColor(16, 185, 129)
  pdf.roundedRect(10, y, 190, 16, 2, 2, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.5)
  pdf.setTextColor(255, 255, 255)
  pdf.text("LÍQUIDO A RECEBER", 15, y + 5.5)
  pdf.setFontSize(15)
  pdf.text(formatCurrency(payroll.netSalary || 0), 15, y + 13)
  pdf.setFontSize(8)
  pdf.text(`Pagamento previsto: ${formatDate(paymentDueDate)}`, 130, y + 9)

  y += 22

  // ── COMPLEMENTARY INFO ──────────────────────────────────────────────────────
  drawDivider(pdf, y)
  y += 4

  pdf.setFillColor(241, 245, 249)
  pdf.roundedRect(10, y, 190, 7, 1.5, 1.5, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.5)
  pdf.setTextColor(51, 65, 85)
  pdf.text("INFORMAÇÕES COMPLEMENTARES", 14, y + 4.8)
  y += 11

  const card2w = 57
  drawInfoCard(pdf, 10, y, card2w, "FGTS do mês", formatCurrency(payroll.fgts || 0), { r: 249, g: 115, b: 22 })
  drawInfoCard(pdf, 70, y, card2w, "Banco / Conta",
    employee.bankName ? `${employee.bankName}${employee.bankAccount ? ` - ${employee.bankAccount}` : ""}` : "Não informado",
    { r: 100, g: 116, b: 139 }
  )
  drawInfoCard(pdf, 130, y, 70, "Espelho de ponto",
    mirror ? `${formatPeriodLabel(mirror.period)} — ${formatMinutes(mirror.workedMinutes)} trab. / ${formatMinutes(mirror.overtimeMinutes)} extra` : "Sem espelho vinculado",
    mirror ? { r: 16, g: 185, b: 129 } : { r: 239, g: 68, b: 68 }
  )

  y += 17

  // ── FISCAL POLICY NOTE ─────────────────────────────────────────────────────
  const noteText = mirror
    ? `Espelho aprovado vinculado. Horas trabalhadas: ${formatMinutes(mirror.workedMinutes)} | Horas extras: ${formatMinutes(mirror.overtimeMinutes)} | Débito: ${formatMinutes(mirror.deficitMinutes)}. ${taxPolicy.inssDescription} ${taxPolicy.irrfDescription}`
    : `Sem espelho aprovado vinculado. ${taxPolicy.inssDescription} ${taxPolicy.irrfDescription}`

  const noteLines = pdf.splitTextToSize(noteText, 178) as string[]
  const noteH = Math.max(12, 6 + noteLines.length * 4.2)
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(10, y, 190, noteH, 1.5, 1.5, "FD")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(6.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text("POLÍTICA FISCAL E REFERÊNCIA DE ESPELHO", 14, y + 4.5)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.setTextColor(51, 65, 85)
  pdf.text(noteLines, 14, y + 9.5)
  y += noteH + 8

  // ── RECEIPT / SIGNATURE ────────────────────────────────────────────────────
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7.5)
  pdf.setTextColor(71, 85, 105)
  pdf.text("Declaro ter recebido as verbas discriminadas neste demonstrativo, conforme a competência indicada acima.", 10, y)
  y += 10

  pdf.setDrawColor(15, 23, 42)
  pdf.setLineWidth(0.4)
  pdf.line(15, y + 6, 85, y + 6)
  pdf.line(120, y + 6, 195, y + 6)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(15, 23, 42)
  pdf.text("Responsável pela empresa", 35, y + 11)
  pdf.text("Assinatura do colaborador", 138, y + 11)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6)
  pdf.setTextColor(148, 163, 184)
  pdf.text(companyName, 35, y + 15.5)
  pdf.text(primaryName, 138, y + 15.5)

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  pdf.setFillColor(241, 245, 249)
  pdf.rect(0, 287, 210, 10, "F")
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6)
  pdf.setTextColor(148, 163, 184)
  pdf.text("Documento digital emitido para conferência, download e arquivo no prontuário do colaborador.", 10, 292)
  pdf.text(`${companyName} • ${companyCnpj} • Emitido em ${formatDate(issueDate)}`, 10, 295.5)

  return Buffer.from(pdf.output("arraybuffer"))
}

export async function generateOfficialPayrollPdf(payrollId: string) {
  const payroll = await (prisma as any).payroll.findUnique({
    where: { id: payrollId },
    include: {
      employee: {
        include: {
          jobTitle: true,
          costCenter: true,
        },
      },
      accountsPayable: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
  })

  if (!payroll) {
    throw new Error("Holerite não encontrado para emissão do PDF.")
  }

  if (payroll.status === "DRAFT") {
    throw new Error("Processe o holerite antes de emitir o PDF oficial.")
  }

  // Try direct mirror id first, then fallback to notes, then search by employee+period
  const mirrorId = extractAttendanceMirrorId(payroll)
  let mirror = mirrorId
    ? await (prisma as any).attendanceMirror.findUnique({
        where: { id: mirrorId },
        select: {
          id: true, period: true, status: true,
          workedMinutes: true, overtimeMinutes: true, deficitMinutes: true,
        },
      })
    : null

  // Fallback: search for an approved mirror for this employee in this period
  if (!mirror) {
    mirror = await (prisma as any).attendanceMirror.findFirst({
      where: {
        employeeId: payroll.employeeId,
        period: payroll.referencePeriod,
        status: "APPROVED",
      },
      select: {
        id: true, period: true, status: true,
        workedMinutes: true, overtimeMinutes: true, deficitMinutes: true,
      },
    })
  }

  const fileName = `${sanitizeFileNamePart(`holerite-${payroll.employeeId}-${payroll.referencePeriod}-${payroll.id}`)}.pdf`
  const storagePath = `employee-documents/${payroll.employeeId}/payrolls/${fileName}`
  const companyProfile = await prisma.companyProfile.findFirst()
  const companyName = companyProfile?.legalName || companyProfile?.tradeName || "SPA DO COLCHAO"
  const companyCnpj = companyProfile?.cnpj ? `CNPJ: ${companyProfile.cnpj}` : "CNPJ NÃO INFORMADO"

  const fileBuffer = buildPayrollPdfBuffer(payroll, mirror, companyName, companyCnpj)

  const fileUrl = await uploadFile(storagePath, fileBuffer)
  const periodLabel = formatPeriodLabel(payroll.referencePeriod)
  const documentName = `Holerite - ${periodLabel}`
  const description = `Holerite da competência ${periodLabel}. PayrollId:${payroll.id}${mirror ? ` MirrorId:${mirror.id}` : ""}`

  const existingDocument = await prisma.employeeDocument.findFirst({
    where: {
      employeeId: payroll.employeeId,
      type: PAYROLL_DOCUMENT_TYPE,
      description: { contains: `PayrollId:${payroll.id}` },
    },
  })

  const document = existingDocument
    ? await prisma.employeeDocument.update({
        where: { id: existingDocument.id },
        data: { name: documentName, description, fileUrl },
      })
    : await prisma.employeeDocument.create({
        data: {
          employeeId: payroll.employeeId,
          type: PAYROLL_DOCUMENT_TYPE,
          name: documentName,
          description,
          fileUrl,
        },
      })

  return {
    payrollId: payroll.id,
    employeeId: payroll.employeeId,
    fileUrl,
    documentId: document.id,
    documentName,
    period: payroll.referencePeriod,
  }
}


