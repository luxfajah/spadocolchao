import { Prisma } from "@prisma/client"

/**
 * Interface representing the core metrics needed to calculate consumption
 */
export interface ReformInputMetrics {
  serviceType: string
  actualWidth: number
  actualLength: number
  actualHeight: number
  
  // Fabric mappings
  topFabricSupplyItemId?: string | null
  sideFabricSupplyItemId?: string | null
  bottomFabricSupplyItemId?: string | null
  
  // Foam / Service
  foamServiceType?: string
  foamSupplyItemId?: string | null
  addedFoamHeight?: number | null

  // Finishes
  tapeSupplyItemId?: string | null
  feetSupplyItemId?: string | null

  // Settings / Services
  optWaterproofing?: boolean
}

type TxClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

/**
 * Motor de Cálculo Paramétrico da Ficha Técnica.
 * Gera os requisitos de material (SaleItemMaterialRequirement) baseado nas dimensões e opções informadas no PDV.
 * Utiliza "2.20m" como largura de rolo padrão se a informação não existir no DB.
 */
export async function generateMaterialRequirementsForReform(
  tx: TxClient,
  saleItemId: string,
  metrics: ReformInputMetrics
) {
  const requirements = []
  
  // Constants and Margins (configurable in future, hardcoded for MVP as per spec)
  const MARGEM_LARGURA_CM = 15 // sobra para costura/grampo
  const MARGEM_COMPRIMENTO_CM = 15
  const MARGEM_ALTURA_CM = 10 
  const LARGURA_UTIL_ROLO_M = 2.20 // Confirmado pelo usuário
  const FATOR_IMPERMEABILIZACAO = 1.2 // Litros por metro quadrado (exemplo)

  const wCm = metrics.actualWidth
  const lCm = metrics.actualLength
  const hCm = metrics.actualHeight

  // 1. TAMPO SUPERIOR
  if (metrics.topFabricSupplyItemId) {
    // Busca o custo atual para tirar o snapshot
    const item = await tx.supplyItem.findUnique({ where: { id: metrics.topFabricSupplyItemId } })
    if (item) {
      // area = ((larguraCm + margemLargura) / 100) * ((comprimentoCm + margemComprimento) / 100)
      const area = ((wCm + MARGEM_LARGURA_CM) / 100) * ((lCm + MARGEM_COMPRIMENTO_CM) / 100)
      const consumoLinearM = area / LARGURA_UTIL_ROLO_M

      requirements.push({
        saleItemId,
        supplyItemId: item.id,
        part: "Tampo Superior",
        quantityCalculated: Number(consumoLinearM.toFixed(3)),
        unit: item.unit || "M",
        unitCostSnapshot: item.averageCost || 0,
        totalCostSnapshot: (item.averageCost || 0) * consumoLinearM,
        notes: `Cálculo por área (${area.toFixed(2)}m2) / L.Rolo(${LARGURA_UTIL_ROLO_M}m)`
      })
    }
  }

  // 2. FUNDO (Bottom)
  if (metrics.bottomFabricSupplyItemId) {
    const item = await tx.supplyItem.findUnique({ where: { id: metrics.bottomFabricSupplyItemId } })
    if (item) {
      const area = ((wCm + MARGEM_LARGURA_CM) / 100) * ((lCm + MARGEM_COMPRIMENTO_CM) / 100)
      const consumoLinearM = area / LARGURA_UTIL_ROLO_M

      requirements.push({
        saleItemId,
        supplyItemId: item.id,
        part: "Fundo",
        quantityCalculated: Number(consumoLinearM.toFixed(3)),
        unit: item.unit || "M",
        unitCostSnapshot: item.averageCost || 0,
        totalCostSnapshot: (item.averageCost || 0) * consumoLinearM,
        notes: `Cálculo por área (${area.toFixed(2)}m2)`
      })
    }
  }

  // 3. LATERAL
  if (metrics.sideFabricSupplyItemId) {
    const item = await tx.supplyItem.findUnique({ where: { id: metrics.sideFabricSupplyItemId } })
    if (item) {
      // perimetro = 2 * ((larguraCm / 100) + (comprimentoCm / 100))
      const perimetro = 2 * ((wCm / 100) + (lCm / 100))
      // areaLateral = perimetro * ((alturaCm + margemAltura) / 100)
      const areaLateral = perimetro * ((hCm + MARGEM_ALTURA_CM) / 100)
      const consumoLinearM = areaLateral / LARGURA_UTIL_ROLO_M

      requirements.push({
        saleItemId,
        supplyItemId: item.id,
        part: "Lateral",
        quantityCalculated: Number(consumoLinearM.toFixed(3)),
        unit: item.unit || "M",
        unitCostSnapshot: item.averageCost || 0,
        totalCostSnapshot: (item.averageCost || 0) * consumoLinearM,
        notes: `Perímetro: ${perimetro.toFixed(2)}m | Altura útil: ${((hCm + MARGEM_ALTURA_CM) / 100).toFixed(2)}m`
      })
    }
  }

  // 4. ESPUMA (Volume)
  if (metrics.foamSupplyItemId && metrics.foamServiceType && metrics.foamServiceType !== 'NENHUM') {
    const item = await tx.supplyItem.findUnique({ where: { id: metrics.foamSupplyItemId } })
    if (item) {
      let alturaCalculoCm = hCm
      if (metrics.foamServiceType === 'CALCO' && metrics.addedFoamHeight) {
        alturaCalculoCm = metrics.addedFoamHeight
      }
      
      const volumeCubicMeters = (wCm / 100) * (lCm / 100) * (alturaCalculoCm / 100)
      
      requirements.push({
        saleItemId,
        supplyItemId: item.id,
        part: metrics.foamServiceType === 'CALCO' ? 'Calço de Espuma' : 'Troca Total de Espuma',
        quantityCalculated: Number(volumeCubicMeters.toFixed(4)),
        unit: 'M3',
        unitCostSnapshot: item.averageCost || 0,
        totalCostSnapshot: (item.averageCost || 0) * volumeCubicMeters,
        notes: `Volume (L x C x A): ${(wCm/100).toFixed(2)}m x ${(lCm/100).toFixed(2)}m x ${(alturaCalculoCm/100).toFixed(2)}m`
      })
    }
  }

  // 5. FITA DE BORDA
  if (metrics.tapeSupplyItemId) {
    const item = await tx.supplyItem.findUnique({ where: { id: metrics.tapeSupplyItemId } })
    if (item) {
      // 2 fitas contornando o tampo (superior + inferior)
      const perimetroSingleM = 2 * ((wCm / 100) + (lCm / 100))
      // O usuário confirmou ser 2 * perimetro
      const perimetroDuploM = 2 * perimetroSingleM
      
      requirements.push({
        saleItemId,
        supplyItemId: item.id,
        part: 'Fita de Borda',
        quantityCalculated: Number(perimetroDuploM.toFixed(2)),
        unit: item.unit || 'M',
        unitCostSnapshot: item.averageCost || 0,
        totalCostSnapshot: (item.averageCost || 0) * perimetroDuploM,
        notes: `2x Perímetro (${perimetroSingleM.toFixed(2)}m/volta)`
      })
    }
  }

  // 6. PÉS DO BOX
  if (metrics.feetSupplyItemId) {
    const item = await tx.supplyItem.findUnique({ where: { id: metrics.feetSupplyItemId } })
    if (item) {
      // Regra validada pelo usuário
      let qtdPes = 6 // Solteiro
      if (wCm >= 193) qtdPes = 15 // King
      else if (wCm >= 158) qtdPes = 12 // Queen
      else if (wCm >= 138) qtdPes = 9 // Casal

      requirements.push({
        saleItemId,
        supplyItemId: item.id,
        part: 'Pés (Box)',
        quantityCalculated: qtdPes,
        unit: item.unit || 'UN',
        unitCostSnapshot: item.averageCost || 0,
        totalCostSnapshot: (item.averageCost || 0) * qtdPes,
        notes: `Base de cálculo pela largura: ${wCm}cm`
      })
    }
  }

  // Execute mass insert of records if any
  if (requirements.length > 0) {
    await tx.saleItemMaterialRequirement.createMany({
      data: requirements
    })
  }

  return requirements
}
