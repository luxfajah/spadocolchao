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

const COMPANY_NAME = "SPA DO COLCHAO"
const COMPANY_DOCUMENT = "CNPJ NÃO INFORMADO NO SISTEMA"

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

  let remainingAdditions = Number(payroll.otherAdditions || 0)
  const overtimeMinutes = mirror?.overtimeMinutes || 0
  let overtimeAmount = 0
  if (overtimeMinutes > 0 && employee.salaryBase) {
    const hourlyRate = employee.salaryBase / 220
    const overtimeRate = hourlyRate * 1.5
    overtimeAmount = (overtimeMinutes / 60) * overtimeRate
  }

  const additionsConfig = [
    { code: "1002", description: "Horas Extras (50%)", amount: overtimeAmount },
    { code: "1601", description: "Vale transporte", amount: benefitBreakdown.transportationBenefit || 0 },
    { code: "1602", description: "Alimentação cedida na empresa", amount: benefitBreakdown.foodBenefit || 0 },
    { code: "1606", description: "Auxílio gasolina / diesel", amount: benefitBreakdown.fuelBenefit || 0 },
    { code: "1603", description: "Bônus assiduidade", amount: employee.attendanceBonusAmount || employee.attendanceBonus || 0 },
    { code: "1604", description: "Auxílio farmácia", amount: employee.pharmacyAllowance || 0 },
    { code: "1605", description: "Auxílio creche", amount: employee.childcareAllowance || 0 },
  ]

  for (const item of additionsConfig) {
    if (remainingAdditions <= 0 || item.amount <= 0) {
      continue
    }

    const amount = Math.min(Number(item.amount), remainingAdditions)
    lines.push({
      code: item.code,
      description: item.description,
      reference: "--",
      amount,
    })
    remainingAdditions -= amount
  }

  if (remainingAdditions > 0) {
    lines.push({
      code: "1699",
      description: "Outras verbas",
      reference: "--",
      amount: remainingAdditions,
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

function buildPayrollPdfBuffer(payroll: any, mirror: any | null) {
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
  const totalDeductions =
    Number(payroll.inss || 0) + Number(payroll.irrf || 0) + Number(payroll.otherDeductions || 0)
  const paymentDueDate = payroll.accountsPayable?.[0]?.dueDate
  const taxPolicy = getPayrollTaxPolicySummary(payroll.referencePeriod)

  pdf.setFillColor(15, 23, 42)
  pdf.roundedRect(10, 10, 190, 20, 3, 3, "F")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(15)
  pdf.setTextColor(255, 255, 255)
  pdf.text(COMPANY_NAME, 14, 19)
  pdf.setFontSize(9)
  pdf.text("RECIBO DE PAGAMENTO / HOLERITE", 14, 25)

  pdf.setFontSize(7.5)
  pdf.text(COMPANY_DOCUMENT, 142, 18)
  pdf.text(`Emissão: ${formatDate(issueDate)}`, 142, 23)
  pdf.text(`Competência: ${formatPeriodLabel(payroll.referencePeriod)}`, 142, 28)

  drawSectionTitle(pdf, 35, "Identificação")
  drawField(pdf, 14, 49, 88, "Colaborador", primaryName)
  drawField(pdf, 108, 49, 88, "Cargo", employee.jobTitle?.name || "Não informado")
  drawField(pdf, 14, 60, 40, "CPF", formatCpf(employee.cpf))
  drawField(pdf, 58, 60, 40, "PIS", formatDocumentValue(employee.pis))
  drawField(pdf, 102, 60, 40, "Admissão", formatDate(employee.admissionDate))
  drawField(
    pdf,
    146,
    60,
    50,
    "Matrícula",
    formatDocumentValue(employee.code || employee.serialId?.toString() || employee.pointMachineId)
  )

  drawField(
    pdf,
    14,
    71,
    88,
    "Centro de custo",
    allocationSnapshot.costCenterName || "Não informado"
  )
  drawField(
    pdf,
    108,
    71,
    88,
    "Setor",
    allocationSnapshot.sectorName || "Não informado"
  )

  if (legalName) {
    drawField(pdf, 14, 82, 88, "Contrato", formatDocumentValue(employee.contractType))
    drawField(pdf, 108, 82, 88, "Nome legal", legalName)
  } else {
    drawField(pdf, 14, 82, 182, "Contrato", formatDocumentValue(employee.contractType))
  }

  const tablesY = 95
  const tablesStartY = tablesY + 12
  const tablesHeight = Math.max(getRubricaTableHeight(earnings), getRubricaTableHeight(deductions))
  drawSectionTitle(pdf, tablesY, "Demonstrativo financeiro")

  drawRubricaTable(pdf, 10, tablesStartY, 92, "Proventos", earnings, { r: 16, g: 185, b: 129 })
  drawRubricaTable(pdf, 108, tablesStartY, 92, "Descontos", deductions, { r: 37, g: 99, b: 235 })

  const summaryY = tablesStartY + tablesHeight + 6
  drawSectionTitle(pdf, summaryY, "Totais e recibo")

  drawField(pdf, 14, summaryY + 13, 55, "Base bruta", formatCurrency(payroll.grossSalary || 0))
  drawField(pdf, 75, summaryY + 13, 55, "Bruto com verbas", formatCurrency(grossWithAdditions))
  drawField(pdf, 136, summaryY + 13, 60, "Descontos totais", formatCurrency(totalDeductions))

  pdf.setFillColor(236, 253, 245)
  pdf.setDrawColor(110, 231, 183)
  pdf.roundedRect(14, summaryY + 27, 182, 15, 2, 2, "FD")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(5, 150, 105)
  pdf.text("LIQUIDO A RECEBER", 18, summaryY + 32.5)
  pdf.setFontSize(16)
  pdf.setTextColor(6, 95, 70)
  pdf.text(formatCurrency(payroll.netSalary || 0), 18, summaryY + 39)

  drawSectionTitle(pdf, summaryY + 47, "Informações complementares")
  drawField(pdf, 14, summaryY + 59, 55, "FGTS do mês", formatCurrency(payroll.fgts || 0))
  drawField(pdf, 75, summaryY + 59, 55, "Pagamento previsto", formatDate(paymentDueDate))
  drawField(
    pdf,
    136,
    summaryY + 59,
    60,
    "Banco / conta",
    employee.bankName
      ? `${employee.bankName}${employee.bankAccount ? ` - ${employee.bankAccount}` : ""}`
      : "Não informado"
  )

  drawField(
    pdf,
    14,
    summaryY + 70,
    88,
    "CPF",
    formatCpf(employee.cpf)
  )
  drawField(
    pdf,
    108,
    summaryY + 70,
    88,
    "Espelho vinculado",
    mirror ? `${formatPeriodLabel(mirror.period)} - ${mirror.status}` : "Sem espelho vinculado"
  )

  const mirrorInfoY = summaryY + 80
  const mirrorInfoHeight = drawObservationBox(
    pdf,
    14,
    mirrorInfoY,
    182,
    "Referência do espelho e política fiscal",
    mirror
      ? `Horas trabalhadas: ${formatMinutes(mirror.workedMinutes)} | Horas extras: ${formatMinutes(mirror.overtimeMinutes)} | Débito: ${formatMinutes(mirror.deficitMinutes)}. ${taxPolicy.inssDescription} ${taxPolicy.irrfDescription}`
      : `Não há espelho aprovado vinculado a este holerite. ${taxPolicy.inssDescription} ${taxPolicy.irrfDescription}`
  )

  const receiptY = mirrorInfoY + mirrorInfoHeight + 7
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.setTextColor(51, 65, 85)
  pdf.text(
    "Declaro ter recebido as verbas discriminadas neste demonstrativo, conforme a competência indicada acima.",
    14,
    receiptY
  )

  const signatureLineY = receiptY + 12
  const signatureLabelY = signatureLineY + 5
  pdf.setDrawColor(203, 213, 225)
  pdf.line(20, signatureLineY, 88, signatureLineY)
  pdf.line(122, signatureLineY, 190, signatureLineY)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.text("Responsável pela empresa", 34, signatureLabelY)
  pdf.text("Assinatura do colaborador", 135, signatureLabelY)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text(
    "Documento digital emitido para conferência, download e arquivo funcional no prontuário do colaborador.",
    14,
    292
  )

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

  const mirrorId = extractAttendanceMirrorId(payroll)
  const mirror = mirrorId
    ? await (prisma as any).attendanceMirror.findUnique({
        where: { id: mirrorId },
        select: {
          id: true,
          period: true,
          status: true,
          workedMinutes: true,
          overtimeMinutes: true,
          deficitMinutes: true,
        },
      })
    : null

  const fileName = `${sanitizeFileNamePart(`holerite-${payroll.employeeId}-${payroll.referencePeriod}-${payroll.id}`)}.pdf`
  const storagePath = `employee-documents/${payroll.employeeId}/payrolls/${fileName}`
  const fileBuffer = buildPayrollPdfBuffer(payroll, mirror)
  
  const fileUrl = await uploadFile(storagePath, fileBuffer)
  const periodLabel = formatPeriodLabel(payroll.referencePeriod)
  const documentName = `Holerite - ${periodLabel}`
  const description = `Holerite da competência ${periodLabel}. PayrollId:${payroll.id}${mirror ? ` MirrorId:${mirror.id}` : ""}`

  const existingDocument = await prisma.employeeDocument.findFirst({
    where: {
      employeeId: payroll.employeeId,
      type: PAYROLL_DOCUMENT_TYPE,
      description: {
        contains: `PayrollId:${payroll.id}`,
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
