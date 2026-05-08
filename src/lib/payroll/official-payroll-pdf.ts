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
  pdf.text(label.toUpperCase(), x + 1, y)
  
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(9)
  pdf.setTextColor(15, 23, 42)
  pdf.text(fitSingleLineText(pdf, value, width - 2), x + 1, y + 5)
  
  pdf.setDrawColor(226, 232, 240)
  pdf.setLineWidth(0.2)
  pdf.line(x, y + 7, x + width, y + 7)
}

function drawSectionTitle(pdf: import("jspdf").jsPDF, y: number, title: string) {
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.setTextColor(15, 23, 42)
  pdf.text(title.toUpperCase(), 10, y + 5)
  
  pdf.setDrawColor(15, 23, 42)
  pdf.setLineWidth(0.4)
  pdf.line(10, y + 7, 200, y + 7)
}

function drawRubricaTable(
  pdf: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  rows: RubricaLine[],
  headerColor: { r: number; g: number; b: number }
) {
  // Table Header
  pdf.setFillColor(248, 250, 252)
  pdf.rect(x, y, width, 7, "F")
  pdf.setDrawColor(226, 232, 240)
  pdf.rect(x, y, width, 7, "D")
  
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.5)
  pdf.setTextColor(15, 23, 42)
  pdf.text(title.toUpperCase(), x + 3, y + 4.8)

  // Column Headers
  const colY = y + 7
  pdf.setFillColor(255, 255, 255)
  pdf.rect(x, colY, width, 6, "F")
  pdf.rect(x, colY, width, 6, "D")
  
  pdf.setFontSize(6.5)
  pdf.setTextColor(100, 116, 139)
  pdf.text("CÓD.", x + 2, colY + 4)
  pdf.text("DESCRIÇÃO", x + 14, colY + 4)
  pdf.text("REF.", x + width - 28, colY + 4)
  pdf.text("VALOR", x + width - 2, colY + 4, { align: "right" })

  let currentY = colY + 6

  if (rows.length === 0) {
    pdf.rect(x, currentY, width, 8, "D")
    pdf.setFont("helvetica", "italic")
    pdf.setFontSize(7)
    pdf.setTextColor(148, 163, 184)
    pdf.text("Sem lançamentos.", x + 3, currentY + 5)
    currentY += 8
  } else {
    for (const row of rows) {
      pdf.setDrawColor(241, 245, 249)
      pdf.rect(x, currentY, width, 8, "D")
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7.5)
      pdf.setTextColor(30, 41, 59)
      pdf.text(row.code, x + 2, currentY + 5)
      pdf.text(fitSingleLineText(pdf, row.description, width - 45), x + 14, currentY + 5)
      pdf.text(row.reference || "--", x + width - 28, currentY + 5)
      pdf.text(formatCurrency(row.amount), x + width - 2, currentY + 5, { align: "right" })
      currentY += 8
    }
  }

  // Table Total
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(226, 232, 240)
  pdf.rect(x, currentY, width, 8, "FD")
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7.5)
  pdf.setTextColor(15, 23, 42)
  pdf.text("TOTAL", x + 3, currentY + 5.5)
  pdf.text(formatCurrency(total), x + width - 2, currentY + 5.5, { align: "right" })
}

function drawObservationBox(
  pdf: import("jspdf").jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  value: string
) {
  pdf.setFontSize(7)
  const lines = pdf.splitTextToSize(value || "--", width - 6) as string[]
  const boxHeight = Math.max(12, 6 + lines.length * 4)

  pdf.setDrawColor(226, 232, 240)
  pdf.rect(x, y, width, boxHeight, "D")

  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(100, 116, 139)
  pdf.text(title.toUpperCase(), x + 3, y + 4)

  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(15, 23, 42)
  pdf.setFontSize(7)
  pdf.text(lines, x + 3, y + 8)

  return boxHeight
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
  // Clean white header with top border
  pdf.setDrawColor(15, 23, 42)
  pdf.setLineWidth(1)
  pdf.line(10, 10, 200, 10)
  
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(14)
  pdf.setTextColor(15, 23, 42)
  pdf.text(companyName.toUpperCase(), 10, 18)
  
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text(companyCnpj, 10, 23)
  
  pdf.setFontSize(10)
  pdf.setTextColor(15, 23, 42)
  pdf.text("DEMONSTRATIVO DE PAGAMENTO MENSAL", 10, 30)

  // Right Side Info
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text("COMPETÊNCIA:", 150, 18)
  pdf.text("DATA EMISSÃO:", 150, 23)
  
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(15, 23, 42)
  pdf.text(formatPeriodLabel(payroll.referencePeriod), 180, 18)
  pdf.text(formatDate(issueDate), 180, 23)

  let y = 40

  // ── EMPLOYEE INFO ──────────────────────────────────────────────────────────
  drawSectionTitle(pdf, y, "Identificação do Colaborador")
  y += 12
  
  drawField(pdf, 10, y, 90, "Nome Completo", primaryName)
  drawField(pdf, 110, y, 90, "Cargo / Função", employee.jobTitle?.name || "Não informado")
  
  y += 12
  drawField(pdf, 10, y, 45, "CPF", formatCpf(employee.cpf))
  drawField(pdf, 60, y, 45, "Matrícula", formatDocumentValue(employee.code || employee.serialId?.toString() || employee.pointMachineId))
  drawField(pdf, 110, y, 45, "Data Admissão", formatDate(employee.admissionDate))
  drawField(pdf, 160, y, 40, "PIS", formatDocumentValue(employee.pis))
  
  y += 12
  drawField(pdf, 10, y, 60, "Centro de Custo", allocationSnapshot.costCenterName || "Não informado")
  drawField(pdf, 75, y, 65, "Setor", allocationSnapshot.sectorName || "Não informado")
  drawField(pdf, 145, y, 55, "Tipo Contrato", formatDocumentValue(employee.contractType))

  y += 18

  // ── FINANCIAL DETAILS ──────────────────────────────────────────────────────
  drawSectionTitle(pdf, y, "Demonstrativo de Valores")
  y += 12
  
  const tableWidth = 92
  drawRubricaTable(pdf, 10, y, tableWidth, "Proventos (Vencimentos)", earnings, { r: 15, g: 23, b: 42 })
  drawRubricaTable(pdf, 108, y, tableWidth, "Descontos", deductions, { r: 15, g: 23, b: 42 })

  const tablesHeight = Math.max(getRubricaTableHeight(earnings), getRubricaTableHeight(deductions))
  y += tablesHeight + 5

  // ── TOTALS ─────────────────────────────────────────────────────────────────
  // Clean totals summary box
  pdf.setDrawColor(15, 23, 42)
  pdf.setLineWidth(0.5)
  pdf.rect(10, y, 190, 25, "D")
  
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(7)
  pdf.setTextColor(100, 116, 139)
  pdf.text("TOTAL PROVENTOS", 15, y + 8)
  pdf.text("TOTAL DESCONTOS", 75, y + 8)
  pdf.text("VALOR LÍQUIDO A RECEBER", 135, y + 8)
  
  pdf.setFontSize(10)
  pdf.setTextColor(15, 23, 42)
  pdf.text(formatCurrency(grossWithAdditions), 15, y + 15)
  pdf.text(formatCurrency(totalDeductions), 75, y + 15)
  
  pdf.setFontSize(14)
  pdf.setTextColor(15, 23, 42)
  pdf.text(formatCurrency(payroll.netSalary || 0), 135, y + 18)
  
  y += 30

  // ── COMPLEMENTARY ──────────────────────────────────────────────────────────
  drawSectionTitle(pdf, y, "Informações Complementares")
  y += 12
  
  drawField(pdf, 10, y, 45, "Base FGTS", formatCurrency(payroll.grossSalary || 0))
  drawField(pdf, 60, y, 45, "FGTS Recolhido", formatCurrency(payroll.fgts || 0))
  drawField(pdf, 110, y, 45, "Data de Pagamento", formatDate(paymentDueDate))
  drawField(pdf, 160, y, 40, "Agência / Conta", employee.bankAccount || "N/A")

  y += 15
  
  const mirrorText = mirror
    ? `Espelho de Ponto Vinculado: ${formatPeriodLabel(mirror.period)}. Horas Trab: ${formatMinutes(mirror.workedMinutes)} | Extras 50%: ${formatMinutes(mirror.overtimeMinutes)} | Débito: ${formatMinutes(mirror.deficitMinutes)}.`
    : "Não há espelho de ponto aprovado vinculado a este demonstrativo."
    
  const infoH = drawObservationBox(pdf, 10, y, 190, "Referência de Ponto e Notas Fiscais", `${mirrorText} ${taxPolicy.inssDescription} ${taxPolicy.irrfDescription}`)
  
  y += infoH + 15

  // ── SIGNATURES ─────────────────────────────────────────────────────────────
  pdf.setFontSize(8)
  pdf.setTextColor(15, 23, 42)
  pdf.text("Declaro ter recebido a importância líquida discriminada neste demonstrativo.", 10, y)
  
  y += 15
  pdf.setLineWidth(0.3)
  pdf.line(15, y, 85, y)
  pdf.line(120, y, 190, y)
  
  pdf.setFontSize(7)
  pdf.text("ASSINATURA DO COLABORADOR", 32, y + 4)
  pdf.text("RESPONSÁVEL PELA EMPRESA", 137, y + 4)
  
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(6)
  pdf.setTextColor(148, 163, 184)
  pdf.text(`Emitido em: ${formatDate(issueDate)} às ${new Date().toLocaleTimeString("pt-BR")}`, 10, 290)
  pdf.text(`Documento gerado pelo sistema Spa do Colchão ERP.`, 10, 293)

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


