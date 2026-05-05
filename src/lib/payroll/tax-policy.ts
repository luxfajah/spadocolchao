type ProgressiveBand = {
  upTo: number
  rate: number
}

type IrrfBand = {
  upTo: number
  rate: number
  deduction: number
}

type PayrollTaxPolicyCode = "BR_2026_OFFICIAL" | "LEGACY"

type PayrollTaxInputs = {
  period: string
  grossSalary: number
  otherAdditions?: number | null
  otherDeductions?: number | null
  taxableIncome?: number | null
  legalDeductionAdjustments?: number[]
}

export type PayrollBenefitSettings = {
  salaryBase?: number | null
  transportationAllowance?: number | null
  transportationPayrollDeductionEnabled?: boolean | null
  transportationPayrollDeductionPercent?: number | null
  foodAllowance?: number | null
  foodPayrollDeductionEnabled?: boolean | null
  foodPayrollDeductionPercent?: number | null
  fuelAllowance?: number | null
}

const OFFICIAL_2026_START_PERIOD = "2026-01"

const FGTS_STANDARD_RATE = 0.08
const SIMPLIFIED_DISCOUNT_2026 = 607.2
const IRRF_FULL_EXEMPTION_LIMIT_2026 = 5000
const IRRF_PARTIAL_REDUCTION_LIMIT_2026 = 7350
const IRRF_FULL_REDUCTION_AMOUNT_2026 = 312.89
const IRRF_PARTIAL_REDUCTION_BASE_2026 = 978.62
const IRRF_PARTIAL_REDUCTION_FACTOR_2026 = 0.133145

const INSS_2026_BANDS: ProgressiveBand[] = [
  { upTo: 1621.0, rate: 0.075 },
  { upTo: 2902.84, rate: 0.09 },
  { upTo: 4354.27, rate: 0.12 },
  { upTo: 8475.55, rate: 0.14 },
]

const IRRF_2026_BANDS: IrrfBand[] = [
  { upTo: 2428.8, rate: 0, deduction: 0 },
  { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
  { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
  { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 908.73 },
]

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toCurrencyValue(value?: number | null) {
  return roundCurrency(Number(value || 0))
}

function toPercentLabel(rate: number) {
  return `${(rate * 100).toFixed(1).replace(".", ",")}%`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function calculateProgressiveValue(baseAmount: number, bands: ProgressiveBand[]) {
  const normalizedBase = Math.max(0, roundCurrency(baseAmount))
  let previousLimit = 0
  let total = 0
  let marginalRate = 0

  const slices = bands
    .map((band) => {
      const taxableSlice = Math.max(0, Math.min(normalizedBase, band.upTo) - previousLimit)
      previousLimit = band.upTo

      if (taxableSlice <= 0) {
        return null
      }

      marginalRate = band.rate
      const amount = roundCurrency(taxableSlice * band.rate)
      total += amount

      return {
        base: roundCurrency(taxableSlice),
        amount,
        rate: band.rate,
      }
    })
    .filter((slice): slice is { base: number; amount: number; rate: number } => Boolean(slice))

  return {
    amount: roundCurrency(total),
    baseAmount: normalizedBase,
    marginalRate,
    slices,
  }
}

function resolveIrrfBand(baseAmount: number) {
  return IRRF_2026_BANDS.find((band) => baseAmount <= band.upTo) || IRRF_2026_BANDS.at(-1)!
}

function calculateIrrfReduction2026(taxableIncome: number, grossIrrf: number) {
  if (taxableIncome <= IRRF_FULL_EXEMPTION_LIMIT_2026) {
    return roundCurrency(Math.min(grossIrrf, IRRF_FULL_REDUCTION_AMOUNT_2026))
  }

  if (taxableIncome <= IRRF_PARTIAL_REDUCTION_LIMIT_2026) {
    const reduction =
      IRRF_PARTIAL_REDUCTION_BASE_2026 -
      IRRF_PARTIAL_REDUCTION_FACTOR_2026 * taxableIncome

    return roundCurrency(Math.min(grossIrrf, Math.max(0, reduction)))
  }

  return 0
}

export function isOfficial2026PayrollPolicy(period: string) {
  return period >= OFFICIAL_2026_START_PERIOD
}

export function getPayrollTaxPolicySummary(period: string) {
  if (!isOfficial2026PayrollPolicy(period)) {
    return {
      code: "LEGACY" as PayrollTaxPolicyCode,
      badgeLabel: "Politica fiscal anterior",
      inssDescription: "INSS calculado pela rotina legada da competencia.",
      irrfDescription: "IRRF calculado pela rotina legada da competencia.",
      combinedDescription:
        "Competencias anteriores a 01/2026 mantem a rotina legada cadastrada no sistema.",
    }
  }

  return {
    code: "BR_2026_OFFICIAL" as PayrollTaxPolicyCode,
    badgeLabel: "Regras oficiais 2026",
    inssDescription:
      "INSS 2026 com aliquota progressiva de 7,5% a 14% sobre a competencia, limitado ao teto de R$ 8.475,55.",
    irrfDescription:
      "IRRF 2026 com desconto simplificado mensal de R$ 607,20, isencao total ate R$ 5.000,00 e redutor linear ate R$ 7.350,00.",
    combinedDescription:
      "Competencia enquadrada nas regras oficiais de 2026 para INSS e IRRF.",
  }
}

export function calculatePayrollBenefitBreakdown({
  salaryBase,
  transportationAllowance,
  transportationPayrollDeductionEnabled,
  transportationPayrollDeductionPercent,
  foodAllowance,
  foodPayrollDeductionEnabled,
  foodPayrollDeductionPercent,
  fuelAllowance,
}: PayrollBenefitSettings) {
  const normalizedSalaryBase = toCurrencyValue(salaryBase)
  const transportationBenefit = toCurrencyValue(transportationAllowance)
  const foodBenefit = toCurrencyValue(foodAllowance)
  const fuelBenefit = toCurrencyValue(fuelAllowance)
  const transportationPercent = clamp(
    Number(
      transportationPayrollDeductionEnabled
        ? transportationPayrollDeductionPercent ?? 6
        : 0
    ),
    0,
    6
  )
  const foodPercent = clamp(Number(foodPayrollDeductionPercent || 0), 0, 100)

  const transportationDeduction =
    transportationPayrollDeductionEnabled && transportationBenefit > 0
      ? roundCurrency(
          Math.min(transportationBenefit, normalizedSalaryBase * (transportationPercent / 100))
        )
      : 0

  const foodDeduction =
    foodPayrollDeductionEnabled && foodBenefit > 0
      ? roundCurrency(foodBenefit * (foodPercent / 100))
      : 0

  return {
    transportationBenefit,
    transportationDeduction,
    transportationDeductionPercent: transportationDeduction > 0 ? transportationPercent : 0,
    foodBenefit,
    foodDeduction,
    foodDeductionPercent: foodDeduction > 0 ? foodPercent : 0,
    fuelBenefit,
    totalAdditions: roundCurrency(transportationBenefit + foodBenefit + fuelBenefit),
    totalDeductions: roundCurrency(transportationDeduction + foodDeduction),
  }
}

export function calculatePayrollValuesByPeriod({
  period,
  grossSalary,
  otherAdditions,
  otherDeductions,
  taxableIncome,
  legalDeductionAdjustments = [],
}: PayrollTaxInputs) {
  const salaryBase = toCurrencyValue(grossSalary)
  const additions = toCurrencyValue(otherAdditions)
  const deductions = toCurrencyValue(otherDeductions)
  const taxableBaseIncome = toCurrencyValue(taxableIncome ?? salaryBase)
  const fgts = roundCurrency(salaryBase * FGTS_STANDARD_RATE)
  const policy = getPayrollTaxPolicySummary(period)

  if (policy.code !== "BR_2026_OFFICIAL") {
    const inss = roundCurrency(salaryBase * 0.09)
    const irrf = roundCurrency(salaryBase * 0.075)
    const netSalary = roundCurrency(salaryBase - inss - irrf - deductions + additions)

    return {
      grossSalary: salaryBase,
      netSalary,
      inss,
      fgts,
      irrf,
      otherDeductions: deductions,
      otherAdditions: additions,
      taxPolicy: {
        ...policy,
        inss: {
          amount: inss,
          ceiling: null,
          marginalRate: 0.09,
          referenceLabel: "9,0%",
        },
        irrf: {
          amount: irrf,
          baseAmount: taxableBaseIncome,
          bracketRate: 0.075,
          deductionAmount: 0,
          reductionAmount: 0,
          deductionMode: "LEGACY" as const,
          deductionUsed: 0,
          referenceLabel: "7,5%",
        },
      },
    }
  }

  const inssCeiling = INSS_2026_BANDS.at(-1)?.upTo || salaryBase
  const inssBase = Math.min(salaryBase, inssCeiling)
  const inssProgressive = calculateProgressiveValue(inssBase, INSS_2026_BANDS)
  const legalDeductionTotal = roundCurrency(
    inssProgressive.amount +
      legalDeductionAdjustments.reduce((total, value) => total + toCurrencyValue(value), 0)
  )
  const deductionUsed = roundCurrency(Math.max(legalDeductionTotal, SIMPLIFIED_DISCOUNT_2026))
  const deductionMode =
    deductionUsed === SIMPLIFIED_DISCOUNT_2026 ? "SIMPLIFIED" : "LEGAL_DEDUCTIONS"
  const irrfBase = roundCurrency(Math.max(0, taxableBaseIncome - deductionUsed))
  const irrfBand = resolveIrrfBand(irrfBase)
  const grossIrrf = roundCurrency(Math.max(0, irrfBase * irrfBand.rate - irrfBand.deduction))
  const irrfReduction = calculateIrrfReduction2026(taxableBaseIncome, grossIrrf)
  const irrf = roundCurrency(Math.max(0, grossIrrf - irrfReduction))
  const netSalary = roundCurrency(salaryBase - inssProgressive.amount - irrf - deductions + additions)

  return {
    grossSalary: salaryBase,
    netSalary,
    inss: inssProgressive.amount,
    fgts,
    irrf,
    otherDeductions: deductions,
    otherAdditions: additions,
    taxPolicy: {
      ...policy,
      inss: {
        amount: inssProgressive.amount,
        ceiling: inssCeiling,
        marginalRate: inssProgressive.marginalRate,
        referenceLabel: `${toPercentLabel(inssProgressive.marginalRate)} prog.`,
      },
      irrf: {
        amount: irrf,
        baseAmount: irrfBase,
        bracketRate: irrfBand.rate,
        deductionAmount: irrfBand.deduction,
        reductionAmount: irrfReduction,
        deductionMode,
        deductionUsed,
        referenceLabel:
          irrf === 0
            ? irrfReduction > 0
              ? "red. 2026"
              : "isento"
            : `${toPercentLabel(irrfBand.rate)}${irrfReduction > 0 ? " c/red." : ""}`,
      },
    },
  }
}
