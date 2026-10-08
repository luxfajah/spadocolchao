/**
 * Módulo de Precificação e Dimensionamento de Camada Extra de Espuma (Pillow Top)
 * 
 * Regras Financeiras Aplicadas:
 * - Margem Líquida Alvo: 30%
 * - Simples Nacional (Impostos): 6.0%
 * - Comissão de Vendas: 3.0%
 * - Insumos base: INS-ESP-D28 (R$ 950/m³), INS-ESP-R26-5CM (R$ 920/m³)
 * - Mão de obra de corte e colagem da lâmina extra: 15-20 min @ R$ 0,55/min
 * - Cola de contato adesiva proporcional à área m²
 */

export type MattressSizeKey = "SOLTEIRO" | "VIUVA" | "CASAL" | "QUEEN" | "KING"

export interface MattressDimensions {
  sizeKey: MattressSizeKey
  label: string
  width: number // em metros
  length: number // em metros
  areaM2: number
}

export interface FoamPricingResult {
  foamId: string
  foamName: string
  heightCm: number
  volumeM3: number
  directCost: number
  additionalPrice: number
  minimumFloorPrice: number
  priceBadge: string
}

export const MATTRESS_SIZE_CONFIG: Record<MattressSizeKey, { label: string; width: number; length: number }> = {
  SOLTEIRO: { label: "Solteiro (88 x 188)", width: 0.88, length: 1.88 },
  VIUVA: { label: "Viúva / Especial (100 x 203)", width: 1.00, length: 2.03 },
  CASAL: { label: "Casal Padrão (138 x 188)", width: 1.38, length: 1.88 },
  QUEEN: { label: "Queen Size (158 x 198)", width: 1.58, length: 1.98 },
  KING: { label: "King Size (193 x 203)", width: 1.93, length: 2.03 },
}

/**
 * Detecta a medida e dimensões físicas do colchão a partir do nome ou categoria
 */
export function detectMattressDimensions(
  productName: string,
  category?: string,
  explicitWidth?: number,
  explicitLength?: number
): MattressDimensions {
  if (explicitWidth && explicitLength && explicitWidth > 0 && explicitLength > 0) {
    const w = explicitWidth > 3 ? explicitWidth / 100 : explicitWidth
    const l = explicitLength > 3 ? explicitLength / 100 : explicitLength
    const area = Number((w * l).toFixed(4))
    
    let key: MattressSizeKey = "CASAL"
    if (w <= 0.95) key = "SOLTEIRO"
    else if (w <= 1.15) key = "VIUVA"
    else if (w <= 1.45) key = "CASAL"
    else if (w <= 1.70) key = "QUEEN"
    else key = "KING"

    return {
      sizeKey: key,
      label: MATTRESS_SIZE_CONFIG[key].label,
      width: w,
      length: l,
      areaM2: area,
    }
  }

  const name = `${productName} ${category || ""}`.toLowerCase()

  if (name.includes("king") || name.includes("1,93") || name.includes("193") || name.includes("2,05")) {
    const cfg = MATTRESS_SIZE_CONFIG.KING
    return { sizeKey: "KING", label: cfg.label, width: cfg.width, length: cfg.length, areaM2: Number((cfg.width * cfg.length).toFixed(4)) }
  }

  if (name.includes("queen") || name.includes("1,58") || name.includes("158")) {
    const cfg = MATTRESS_SIZE_CONFIG.QUEEN
    return { sizeKey: "QUEEN", label: cfg.label, width: cfg.width, length: cfg.length, areaM2: Number((cfg.width * cfg.length).toFixed(4)) }
  }

  if (name.includes("viúva") || name.includes("viuva") || name.includes("1,00") || name.includes("100 x 203")) {
    const cfg = MATTRESS_SIZE_CONFIG.VIUVA
    return { sizeKey: "VIUVA", label: cfg.label, width: cfg.width, length: cfg.length, areaM2: Number((cfg.width * cfg.length).toFixed(4)) }
  }

  if (name.includes("solteiro") || name.includes("0,88") || name.includes("88 x 188")) {
    const cfg = MATTRESS_SIZE_CONFIG.SOLTEIRO
    return { sizeKey: "SOLTEIRO", label: cfg.label, width: cfg.width, length: cfg.length, areaM2: Number((cfg.width * cfg.length).toFixed(4)) }
  }

  // Padrão Casal
  const cfg = MATTRESS_SIZE_CONFIG.CASAL
  return { sizeKey: "CASAL", label: cfg.label, width: cfg.width, length: cfg.length, areaM2: Number((cfg.width * cfg.length).toFixed(4)) }
}

export const VIBRO_CONVERSION_PRICE = 850;
export const VIBRO_CONVERSION_COST = 450;

/**
 * Matriz de Precificação Oficial de Camada Extra de Espuma
 * Retorna custo de matéria-prima, volume em m³ e preço sugerido de venda com 30% de margem líquida
 */
export function getExtraFoamPricing(
  foamId: string,
  sizeKey: MattressSizeKey
): FoamPricingResult {
  if (!foamId || foamId === "sem_extra") {
    return {
      foamId: "sem_extra",
      foamName: "Sem Camada Extra (Padrão)",
      heightCm: 0,
      volumeM3: 0,
      directCost: 0,
      additionalPrice: 0,
      minimumFloorPrice: 0,
      priceBadge: "Incluso",
    };
  }

  const dim = MATTRESS_SIZE_CONFIG[sizeKey] || MATTRESS_SIZE_CONFIG.CASAL
  const area = dim.width * dim.length

  let heightCm = 5
  let costPerM3 = 1050 // D33 / D28 conforto
  let foamName = "Camada Extra de Espuma 5cm"
  let laborMin = 20
  let glueBaseKg = 0.22

  if (foamId === "extra_d33_5cm" || foamId === "extra_d28_5cm") {
    heightCm = 5
    costPerM3 = 1050
    foamName = "Camada Extra +5cm Espuma D-33 Conforto"
    laborMin = 20
    glueBaseKg = 0.22
  } else if (foamId === "extra_r26_5cm") {
    heightCm = 5
    costPerM3 = 920
    foamName = "Camada Extra +5cm Ortopédica Firme (R-26)"
    laborMin = 20
    glueBaseKg = 0.22
  }

  const heightM = heightCm / 100
  const volumeM3 = Number((area * heightM).toFixed(4))

  // Custo Direto (Espuma + Cola de Contato + Mão de Obra de colagem de fábrica)
  const foamCost = volumeM3 * costPerM3
  const glueCost = (glueBaseKg * (area / (1.38 * 1.88))) * 38.0
  const laborCost = laborMin * 0.55 // R$ 33/h da mão de obra
  const directCost = Number((foamCost + glueCost + laborCost).toFixed(2))

  // Preço com 30% de margem líquida (Divisor: 1 - (0.06 simples + 0.03 comissão + 0.30 margem) = 0.61)
  const exactPrice = directCost / 0.61
  const roundedPrice = Math.round(exactPrice / 10) * 10 // Arredonda para múltiplo comercial de R$ 10
  
  // Piso mínimo negociável (cobre custo direto + impostos mínimos)
  const minimumFloor = Math.round((directCost / 0.85) / 10) * 10

  const formattedBRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(roundedPrice)

  return {
    foamId,
    foamName,
    heightCm,
    volumeM3,
    directCost,
    additionalPrice: roundedPrice,
    minimumFloorPrice: minimumFloor,
    priceBadge: `+ ${formattedBRL}`,
  }
}

/**
 * Calcula o volume em m³ para baixa de estoque
 */
export function calculateExtraFoamVolume(
  width: number,
  length: number,
  heightCm: number,
  quantity: number = 1
): number {
  if (!width || !length || !heightCm) return 0
  const w = width > 3 ? width / 100 : width
  const l = length > 3 ? length / 100 : length
  const h = heightCm / 100
  return Number(((w * l * h) * quantity).toFixed(4))
}
