"use client";

import React from "react";

export interface OrderPrintDocumentProps {
  order: any;
  format?: "a4" | "thermal";
  guiaMode?: "both" | "production" | "customer";
  copies?: 1 | 2;
  companyInfo?: {
    name?: string;
    tradeName?: string;
    legalName?: string;
    cnpj?: string;
    stateRegistration?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    email?: string;
    logoUrl?: string;
  };
}

// =========================================================================
// HELPERS DE FORMATAÇÃO E EXTRAÇÃO
// =========================================================================

export const formatBRL = (value: number | null | undefined) => {
  if (typeof value !== "number") return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const formatDate = (date: any) => {
  if (!date) return "Não agendado";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (_e) {
    return "Data inválida";
  }
};

export const formatDateTime = (date: any) => {
  if (!date) return "---";
  try {
    const d = new Date(date);
    return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch (_e) {
    return "---";
  }
};

export const formatTimeOnly = (date: any) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch (_e) {
    return "";
  }
};

/**
 * Extrai o número simplificado e unificado do pedido para ambas as guias.
 * Exemplo: VEND-202610-00405 -> #405 (com referência completa VEND-202610-00405)
 * IMP-VENDAS-2026-05-369 -> #369
 */
export function getSimplifiedOrderNumber(
  saleNumber?: string | null,
  orderCode?: string | null,
  orderId?: string | null
): { simplified: string; badgeNumber: string; reference: string } {
  if (saleNumber) {
    const match = saleNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        return {
          simplified: `#${num}`,
          badgeNumber: `PEDIDO #${num}`,
          reference: saleNumber,
        };
      }
    }
    return {
      simplified: `#${saleNumber}`,
      badgeNumber: `PEDIDO #${saleNumber}`,
      reference: saleNumber,
    };
  }

  if (orderCode) {
    return {
      simplified: `#${orderCode}`,
      badgeNumber: `PEDIDO #${orderCode}`,
      reference: orderCode,
    };
  }

  const fallback = orderId ? orderId.slice(-6).toUpperCase() : "001";
  return {
    simplified: `#${fallback}`,
    badgeNumber: `PEDIDO #${fallback}`,
    reference: orderId || fallback,
  };
}

/**
 * Extrai todos os dados técnicos de manufatura, medidas e revestimentos de um item
 */
function extractTechnicalSpecs(item: any) {
  const reformMattress = item.detailMattressReform;
  const newMattress = item.detailNewMattress;
  const reformBox = item.detailBoxReform;
  const newBox = item.detailNewBox;
  const cleaning = item.detailUpholsteryCleaning;

  const actualW =
    reformMattress?.actualWidth ||
    newMattress?.actualWidth ||
    reformBox?.actualWidth ||
    newBox?.actualWidth ||
    0;
  const actualL =
    reformMattress?.actualLength ||
    newMattress?.actualLength ||
    reformBox?.actualLength ||
    newBox?.actualLength ||
    0;
  const actualH =
    reformMattress?.actualHeight ||
    newMattress?.actualHeight ||
    reformBox?.actualHeight ||
    newBox?.actualHeight ||
    0;

  const commercialSize =
    reformMattress?.commercialSize ||
    newMattress?.commercialSize ||
    reformBox?.commercialSize ||
    newBox?.commercialSize;

  const topFabricName =
    reformMattress?.topFabric?.name ||
    newMattress?.topFabric?.name ||
    reformBox?.topFabric?.name ||
    newBox?.topFabric?.name;
  const topColor =
    reformMattress?.topFabricColor ||
    newMattress?.topFabricColor ||
    reformBox?.topFabricColor ||
    newBox?.topFabricColor;

  const sideFabricName =
    reformMattress?.sideFabric?.name ||
    newMattress?.sideFabric?.name ||
    reformBox?.sideFabric?.name ||
    newBox?.sideFabric?.name;
  const sideColor =
    reformMattress?.sideFabricColor ||
    newMattress?.sideFabricColor ||
    reformBox?.sideFabricColor ||
    newBox?.sideFabricColor;

  const bottomFabricName =
    reformMattress?.bottomFabric?.name ||
    newMattress?.bottomFabric?.name;
  const bottomColor =
    reformMattress?.bottomFabricColor ||
    newMattress?.bottomFabricColor;

  const tapeName =
    reformMattress?.tapeSupply?.name ||
    newMattress?.tapeSupply?.name ||
    reformBox?.tapeSupply?.name ||
    newBox?.tapeSupply?.name;

  const feetName =
    reformMattress?.feetSupply?.name ||
    newMattress?.feetSupply?.name ||
    reformBox?.feetSupply?.name ||
    newBox?.feetSupply?.name;

  const density =
    reformMattress?.density ||
    newMattress?.density;

  const mattressType =
    reformMattress?.mattressType ||
    newMattress?.mattressType;

  const foamService = reformMattress?.foamServiceType;
  const addedFoamHeight = reformMattress?.addedFoamHeight;
  const foamSupplyName =
    reformMattress?.foamSupply?.name ||
    newMattress?.foamSupply?.name;

  const boxType = reformBox?.boxType || newBox?.boxType;
  const hasStructureReinforce =
    reformBox?.optStructureReinforce || newBox?.optStructureReinforce;
  const hasHardwareRepl =
    reformBox?.optHardwareReplacement || newBox?.optHardwareReplacement;

  const technicalNotes =
    item.notes ||
    reformMattress?.technicalNotes ||
    newMattress?.technicalNotes ||
    reformBox?.technicalNotes ||
    newBox?.technicalNotes;

  return {
    actualW,
    actualL,
    actualH,
    commercialSize,
    topFabricName,
    topColor,
    sideFabricName,
    sideColor,
    bottomFabricName,
    bottomColor,
    tapeName,
    feetName,
    density,
    mattressType,
    foamService,
    addedFoamHeight,
    foamSupplyName,
    boxType,
    hasStructureReinforce,
    hasHardwareRepl,
    technicalNotes,
    cleaningRows: cleaning?.rows || [],
  };
}

// =========================================================================
// TIPOS E HELPERS DE SEPARAÇÃO ENTRE COLCHÃO / CAMA E BASE BOX (CHÃO DE FÁBRICA)
// =========================================================================

export interface FactoryMattressSpec {
  itemIndex: number;
  itemDescription: string;
  quantity: number;
  serviceCategory: string;
  commercialSize?: string;
  actualW: number;
  actualL: number;
  actualH: number;
  mattressType?: string;
  density?: string;
  topFabric?: string;
  topFabricColor?: string;
  sideFabric?: string;
  sideFabricColor?: string;
  bottomFabric?: string;
  bottomFabricColor?: string;
  tapeName?: string;
  foamService?: string;
  addedFoamHeight?: number | null;
  foamSupplyName?: string;
  options: string[];
  technicalNotes?: string;
}

export interface FactoryBoxSpec {
  itemIndex: number;
  itemDescription: string;
  quantity: number;
  serviceCategory: string;
  commercialSize?: string;
  actualW: number;
  actualL: number;
  actualH: number;
  boxType?: string;
  isBipartido?: boolean;
  topFabric?: string;
  topFabricColor?: string;
  sideFabric?: string;
  sideFabricColor?: string;
  feetName?: string;
  tapeName?: string;
  hasStructureReinforce?: boolean;
  hasHardwareRepl?: boolean;
  options: string[];
  technicalNotes?: string;
}

export interface FactoryOtherSpec {
  itemIndex: number;
  itemDescription: string;
  quantity: number;
  type?: string;
  technicalNotes?: string;
  cleaningRows?: any[];
}

function inferDimensionsFromText(text: string): {
  w: number;
  l: number;
  hMattress: number;
  hBox: number;
  sizeName: string;
  isBipartido: boolean;
} {
  const lower = text.toLowerCase();

  const dimMatch = text.match(/(\d{2,3})\s*[xX*]\s*(\d{2,3})(?:\s*[xX*]\s*(\d{2,3}))?/);
  if (dimMatch) {
    const w = parseInt(dimMatch[1], 10);
    const l = parseInt(dimMatch[2], 10);
    const h = dimMatch[3] ? parseInt(dimMatch[3], 10) : w >= 150 ? 30 : 25;
    return {
      w,
      l,
      hMattress: h,
      hBox: 25,
      sizeName:
        w >= 190
          ? "King"
          : w >= 150
          ? "Queen"
          : w >= 135
          ? "Casal"
          : w >= 110
          ? "Viúva"
          : "Solteiro",
      isBipartido: w >= 150,
    };
  }

  if (lower.includes("super king") || lower.includes("king") || lower.includes("1,93") || lower.includes("193")) {
    return { w: 193, l: 203, hMattress: 32, hBox: 25, sizeName: "King", isBipartido: true };
  }
  if (lower.includes("queen") || lower.includes("1,58") || lower.includes("158")) {
    return { w: 158, l: 198, hMattress: 30, hBox: 25, sizeName: "Queen", isBipartido: true };
  }
  if (lower.includes("viúva") || lower.includes("viuva") || lower.includes("1,28") || lower.includes("128")) {
    return { w: 128, l: 188, hMattress: 25, hBox: 25, sizeName: "Viúva", isBipartido: false };
  }
  if (lower.includes("casal") || lower.includes("1,38") || lower.includes("138")) {
    return { w: 138, l: 188, hMattress: 26, hBox: 25, sizeName: "Casal", isBipartido: false };
  }
  if (lower.includes("solteirão") || lower.includes("solteirao") || lower.includes("0,96") || lower.includes("96")) {
    return { w: 96, l: 203, hMattress: 25, hBox: 25, sizeName: "Solteirão", isBipartido: false };
  }
  if (lower.includes("solteiro") || lower.includes("0,88") || lower.includes("88")) {
    return { w: 88, l: 188, hMattress: 22, hBox: 25, sizeName: "Solteiro", isBipartido: false };
  }

  return { w: 0, l: 0, hMattress: 0, hBox: 25, sizeName: "Sob Medida", isBipartido: false };
}

export function categorizeOrderItemsForFactory(items: any[]) {
  const mattresses: FactoryMattressSpec[] = [];
  const boxes: FactoryBoxSpec[] = [];
  const others: FactoryOtherSpec[] = [];

  items.forEach((item: any, idx: number) => {
    const desc = item.description || "";
    const descLower = desc.toLowerCase();
    const prodName = (item.productService?.name || "").toLowerCase();
    const prodType = (item.productService?.type || item.type || "").toLowerCase();

    const reformMattress = item.detailMattressReform;
    const newMattress = item.detailNewMattress;
    const reformBox = item.detailBoxReform;
    const newBox = item.detailNewBox;
    const cleaning = item.detailUpholsteryCleaning;

    const hasMattressDetails = !!(reformMattress || newMattress);
    const hasBoxDetails = !!(reformBox || newBox);
    const hasCleaningDetails = !!cleaning;

    const isCombo =
      descLower.includes("conjunto") ||
      descLower.includes("box + colch") ||
      descLower.includes("colchão + box") ||
      descLower.includes("colchao + box") ||
      descLower.includes("cama box") ||
      prodName.includes("conjunto") ||
      (hasMattressDetails && hasBoxDetails);

    const isBoxOnly =
      !isCombo &&
      (hasBoxDetails ||
        descLower.includes("box") ||
        descLower.includes("sommier") ||
        descLower.includes("baú") ||
        descLower.includes("bau") ||
        prodType.includes("box"));

    const isMattressOnly =
      !isCombo &&
      !isBoxOnly &&
      (hasMattressDetails ||
        descLower.includes("colchão") ||
        descLower.includes("colchao") ||
        descLower.includes("cama") ||
        prodType.includes("colchao") ||
        prodType.includes("colchão"));

    if (hasCleaningDetails || prodType.includes("limpeza") || prodType.includes("higienização")) {
      others.push({
        itemIndex: idx + 1,
        itemDescription: item.description,
        quantity: item.quantity,
        type: "Higienização / Limpeza de Estofados",
        technicalNotes: item.notes || cleaning?.technicalNotes,
        cleaningRows: cleaning?.rows || [],
      });
      return;
    }

    if (isCombo) {
      // É um conjunto: divide tecnicamente entre Ficha do Colchão e Ficha da Base Box
      const inferred = inferDimensionsFromText(desc);

      // --- PARTE 1: COLCHÃO / CAMA ---
      const mW = reformMattress?.actualWidth || newMattress?.actualWidth || inferred.w;
      const mL = reformMattress?.actualLength || newMattress?.actualLength || inferred.l;
      const mH = reformMattress?.actualHeight || newMattress?.actualHeight || inferred.hMattress;
      const mSize = reformMattress?.commercialSize || newMattress?.commercialSize || inferred.sizeName;

      const mOptions: string[] = [];
      if (reformMattress?.optTotalReplacement) mOptions.push("Troca Total de Estrutura");
      if (reformMattress?.optFullFabricRepl) mOptions.push("Troca Total do Tecido");
      if (reformMattress?.optPartialFabricRepl) mOptions.push("Troca Parcial de Tecido");
      if (reformMattress?.optFoamStructReinforce) mOptions.push("Reforço Estrutural de Bordas / Espuma");
      if (reformMattress?.optSpringSystemRepl) mOptions.push("Substituição do Molejo");
      if (reformMattress?.optSpringSystemRepair) mOptions.push("Reparo das Molas");
      if (reformMattress?.optLeveling) mOptions.push("Nivelamento de Camadas");
      if (reformMattress?.optRegluing) mOptions.push("Recolagem Geral");
      if (reformMattress?.optWaterproofing) mOptions.push("Impermeabilização");

      mattresses.push({
        itemIndex: idx + 1,
        itemDescription: `${item.description} [COLCHÃO / CAMA]`,
        quantity: item.quantity,
        serviceCategory: reformMattress ? "Reforma de Colchão (Conjunto)" : "Colchão Novo (Conjunto)",
        commercialSize: mSize,
        actualW: mW,
        actualL: mL,
        actualH: mH,
        mattressType: reformMattress?.mattressType || newMattress?.mattressType || "Molas Ensacadas Pocket / Espuma",
        density: reformMattress?.density || newMattress?.density || "D33 / Conforto",
        topFabric: reformMattress?.topFabric?.name || newMattress?.topFabric?.name || "Malha Especial / Bordado",
        topFabricColor: reformMattress?.topFabricColor || newMattress?.topFabricColor,
        sideFabric: reformMattress?.sideFabric?.name || newMattress?.sideFabric?.name || "Suede Nobre / Linho",
        sideFabricColor: reformMattress?.sideFabricColor || newMattress?.sideFabricColor,
        bottomFabric: reformMattress?.bottomFabric?.name || newMattress?.bottomFabric?.name || "Antiderrapante",
        bottomFabricColor: reformMattress?.bottomFabricColor || newMattress?.bottomFabricColor,
        tapeName: reformMattress?.tapeSupply?.name || newMattress?.tapeSupply?.name,
        foamService: reformMattress?.foamServiceType,
        addedFoamHeight: reformMattress?.addedFoamHeight,
        foamSupplyName: reformMattress?.foamSupply?.name || newMattress?.foamSupply?.name,
        options: mOptions,
        technicalNotes: item.notes || reformMattress?.technicalNotes || newMattress?.technicalNotes,
      });

      // --- PARTE 2: BASE BOX / SOMMIER ---
      const bW = reformBox?.actualWidth || newBox?.actualWidth || mW || inferred.w;
      const bL = reformBox?.actualLength || newBox?.actualLength || mL || inferred.l;
      const bH = reformBox?.actualHeight || newBox?.actualHeight || 25;
      const bSize = reformBox?.commercialSize || newBox?.commercialSize || mSize || inferred.sizeName;
      const isBipartido = bW >= 150 || reformBox?.boxType?.includes("bipartido") || newBox?.boxType?.includes("bipartido");

      const bOptions: string[] = [];
      if (reformBox?.optTotalReplacement) bOptions.push("Troca Total de Madeiramento");
      if (reformBox?.optFullFabricRepl) bOptions.push("Troca Total do Tecido");
      if (reformBox?.optPartialFabricRepl) bOptions.push("Troca Parcial de Tecido");
      if (reformBox?.optStructureReinforce || newBox?.optStructureReinforce) bOptions.push("Reforço Estrutural de Madeira");
      if (reformBox?.optStructureRepair) bOptions.push("Reparo de Travessas e Ripas");
      if (reformBox?.optHardwareReplacement || newBox?.optHardwareReplacement) bOptions.push("Troca de Ferragens / Pistões");
      if (reformBox?.optWaterproofing) bOptions.push("Impermeabilização");

      boxes.push({
        itemIndex: idx + 1,
        itemDescription: `${item.description} [BASE BOX / SOMMIER]`,
        quantity: item.quantity,
        serviceCategory: reformBox ? "Reforma de Base Box (Conjunto)" : "Base Box Nova (Conjunto)",
        commercialSize: bSize,
        actualW: bW,
        actualL: bL,
        actualH: bH,
        boxType: reformBox?.boxType || newBox?.boxType || (isBipartido ? "Bipartido (2 Peças)" : "Box Inteiro"),
        isBipartido,
        topFabric: reformBox?.topFabric?.name || newBox?.topFabric?.name || "Antiderrapante / Padrão",
        topFabricColor: reformBox?.topFabricColor || newBox?.topFabricColor,
        sideFabric:
          reformBox?.sideFabric?.name ||
          newBox?.sideFabric?.name ||
          reformMattress?.sideFabric?.name ||
          newMattress?.sideFabric?.name ||
          "Suede Nobre (Combinando c/ Colchão)",
        sideFabricColor:
          reformBox?.sideFabricColor ||
          newBox?.sideFabricColor ||
          reformMattress?.sideFabricColor ||
          newMattress?.sideFabricColor,
        feetName: reformBox?.feetSupply?.name || newBox?.feetSupply?.name || "Pés de Madeira Maciça 12cm",
        tapeName: reformBox?.tapeSupply?.name || newBox?.tapeSupply?.name,
        hasStructureReinforce: reformBox?.optStructureReinforce || newBox?.optStructureReinforce,
        hasHardwareRepl: reformBox?.optHardwareReplacement || newBox?.optHardwareReplacement,
        options: bOptions,
        technicalNotes: reformBox?.technicalNotes || newBox?.technicalNotes || item.notes,
      });
    } else if (isBoxOnly) {
      // Apenas Box
      const inferred = inferDimensionsFromText(desc);
      const bW = reformBox?.actualWidth || newBox?.actualWidth || inferred.w;
      const bL = reformBox?.actualLength || newBox?.actualLength || inferred.l;
      const bH = reformBox?.actualHeight || newBox?.actualHeight || 25;
      const bSize = reformBox?.commercialSize || newBox?.commercialSize || inferred.sizeName;
      const isBipartido = bW >= 150 || reformBox?.boxType?.includes("bipartido") || newBox?.boxType?.includes("bipartido");

      const bOptions: string[] = [];
      if (reformBox?.optTotalReplacement) bOptions.push("Troca Total de Madeiramento");
      if (reformBox?.optFullFabricRepl) bOptions.push("Troca Total do Tecido");
      if (reformBox?.optPartialFabricRepl) bOptions.push("Troca Parcial de Tecido");
      if (reformBox?.optStructureReinforce || newBox?.optStructureReinforce) bOptions.push("Reforço Estrutural de Madeira");
      if (reformBox?.optStructureRepair) bOptions.push("Reparo de Travessas e Ripas");
      if (reformBox?.optHardwareReplacement || newBox?.optHardwareReplacement) bOptions.push("Troca de Ferragens / Pistões");
      if (reformBox?.optWaterproofing) bOptions.push("Impermeabilização");

      boxes.push({
        itemIndex: idx + 1,
        itemDescription: item.description,
        quantity: item.quantity,
        serviceCategory: reformBox ? "Reforma de Base Box" : "Base Box Nova",
        commercialSize: bSize,
        actualW: bW,
        actualL: bL,
        actualH: bH,
        boxType: reformBox?.boxType || newBox?.boxType || (isBipartido ? "Bipartido (2 Peças)" : "Box Inteiro"),
        isBipartido,
        topFabric: reformBox?.topFabric?.name || newBox?.topFabric?.name || "Antiderrapante / Padrão",
        topFabricColor: reformBox?.topFabricColor || newBox?.topFabricColor,
        sideFabric: reformBox?.sideFabric?.name || newBox?.sideFabric?.name || "Padrão",
        sideFabricColor: reformBox?.sideFabricColor || newBox?.sideFabricColor,
        feetName: reformBox?.feetSupply?.name || newBox?.feetSupply?.name || "Pés de Madeira Maciça 12cm",
        tapeName: reformBox?.tapeSupply?.name || newBox?.tapeSupply?.name,
        hasStructureReinforce: reformBox?.optStructureReinforce || newBox?.optStructureReinforce,
        hasHardwareRepl: reformBox?.optHardwareReplacement || newBox?.optHardwareReplacement,
        options: bOptions,
        technicalNotes: item.notes || reformBox?.technicalNotes || newBox?.technicalNotes,
      });
    } else if (isMattressOnly) {
      // Apenas Colchão
      const inferred = inferDimensionsFromText(desc);
      const mW = reformMattress?.actualWidth || newMattress?.actualWidth || inferred.w;
      const mL = reformMattress?.actualLength || newMattress?.actualLength || inferred.l;
      const mH = reformMattress?.actualHeight || newMattress?.actualHeight || inferred.hMattress;
      const mSize = reformMattress?.commercialSize || newMattress?.commercialSize || inferred.sizeName;

      const mOptions: string[] = [];
      if (reformMattress?.optTotalReplacement) mOptions.push("Troca Total de Estrutura");
      if (reformMattress?.optFullFabricRepl) mOptions.push("Troca Total do Tecido");
      if (reformMattress?.optPartialFabricRepl) mOptions.push("Troca Parcial de Tecido");
      if (reformMattress?.optFoamStructReinforce) mOptions.push("Reforço Estrutural de Bordas / Espuma");
      if (reformMattress?.optSpringSystemRepl) mOptions.push("Substituição do Molejo");
      if (reformMattress?.optSpringSystemRepair) mOptions.push("Reparo das Molas");
      if (reformMattress?.optLeveling) mOptions.push("Nivelamento de Camadas");
      if (reformMattress?.optRegluing) mOptions.push("Recolagem Geral");
      if (reformMattress?.optWaterproofing) mOptions.push("Impermeabilização");

      mattresses.push({
        itemIndex: idx + 1,
        itemDescription: item.description,
        quantity: item.quantity,
        serviceCategory: reformMattress ? "Reforma de Colchão" : "Colchão Novo",
        commercialSize: mSize,
        actualW: mW,
        actualL: mL,
        actualH: mH,
        mattressType: reformMattress?.mattressType || newMattress?.mattressType || "Molas Ensacadas Pocket / Espuma",
        density: reformMattress?.density || newMattress?.density || "D33 / Conforto",
        topFabric: reformMattress?.topFabric?.name || newMattress?.topFabric?.name || "Malha Especial / Bordado",
        topFabricColor: reformMattress?.topFabricColor || newMattress?.topFabricColor,
        sideFabric: reformMattress?.sideFabric?.name || newMattress?.sideFabric?.name || "Suede Nobre / Linho",
        sideFabricColor: reformMattress?.sideFabricColor || newMattress?.sideFabricColor,
        bottomFabric: reformMattress?.bottomFabric?.name || newMattress?.bottomFabric?.name || "Antiderrapante",
        bottomFabricColor: reformMattress?.bottomFabricColor || newMattress?.bottomFabricColor,
        tapeName: reformMattress?.tapeSupply?.name || newMattress?.tapeSupply?.name,
        foamService: reformMattress?.foamServiceType,
        addedFoamHeight: reformMattress?.addedFoamHeight,
        foamSupplyName: reformMattress?.foamSupply?.name || newMattress?.foamSupply?.name,
        options: mOptions,
        technicalNotes: item.notes || reformMattress?.technicalNotes || newMattress?.technicalNotes,
      });
    } else {
      // Outros produtos
      others.push({
        itemIndex: idx + 1,
        itemDescription: item.description,
        quantity: item.quantity,
        type: item.productService?.type || "Acessório / Produto Especial",
        technicalNotes: item.notes,
      });
    }
  });

  return {
    mattresses,
    boxes,
    others,
    hasMattress: mattresses.length > 0,
    hasBox: boxes.length > 0,
    hasBoth: mattresses.length > 0 && boxes.length > 0,
  };
}

// =========================================================================
// COMPONENTE PRINCIPAL
// =========================================================================

export function OrderPrintDocument({
  order,
  format = "a4",
  guiaMode = "both",
  copies = 2,
  companyInfo = {
    name: "SPA DO COLCHÃO",
    tradeName: "Spa do Colchão",
    legalName: "Spa do Colchão LTDA",
    cnpj: "61.969.615/0001-15",
    stateRegistration: "91163387-66",
    phone: "(45) 99937-1901",
    whatsapp: "(45) 99937-1901",
    address: "Rua Luiza Wandscheer, 1510 - Panorama, Foz do Iguaçu - PR",
    email: "contato@spadocolchao.com",
    logoUrl: "/logo.png",
  },
}: OrderPrintDocumentProps) {
  if (!order || !order.sale) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500">
        Nenhum pedido selecionado para visualização.
      </div>
    );
  }

  const { sale } = order;
  const { customer, seller, items = [], installments = [] } = sale;
  const addresses = customer?.addresses || [];
  const mainAddress = addresses.find((a: any) => a.isMain) || addresses[0];

  // Resolver endereço efetivo do pedido
  const effectiveAddress = {
    street: order.street || mainAddress?.street || "",
    number: order.number || mainAddress?.number || "S/N",
    complement: order.complement || mainAddress?.complement || "",
    neighborhood: order.neighborhood || mainAddress?.neighborhood || "",
    city: order.city || mainAddress?.city || "",
    state: order.state || mainAddress?.state || "",
    zipCode: order.zipCode || mainAddress?.zipCode || "",
    reference: mainAddress?.reference || "",
  };

  // Separação técnica fabril: Colchão vs Base Box
  const factorySpecs = categorizeOrderItemsForFactory(items);

  // Extrair número unificado e simplificado
  const orderNumberInfo = getSimplifiedOrderNumber(
    sale.number,
    order.code,
    order.id
  );

  // Visibilidade das 2 guias
  const showGuia1 = guiaMode === "both" || guiaMode === "production";
  const showGuia2 = guiaMode === "both" || guiaMode === "customer";

  // =======================================================================
  // GUIA 1 DE 2: ORDEM DE PRODUÇÃO & CHÃO DE FÁBRICA
  // 1 FOLHA A4 COMPLETA E DEDICADA PARA A FÁBRICA.
  // PREENCHE TODA A FOLHA A4 COM LOGÍSTICA COMPLETA DE RETIRADA E ENTREGA,
  // DIVISÃO CLARA ENTRE COLCHÃO E BASE BOX, E ZERO DADOS FINANCEIROS.
  // =======================================================================
  const renderGuiaProducaoA4 = () => {
    return (
      <div
        className={`guia-page guia-page-1 relative ${
          showGuia2 ? "guia-has-next-page" : ""
        } w-full max-w-[210mm] h-[284mm] max-h-[284mm] bg-white text-black font-sans mx-auto p-3.5 sm:p-4 border border-black rounded-none print:border-none print:p-0 print:m-0 text-[8px] leading-tight flex flex-col justify-between overflow-hidden`}
      >
        {/* MARCA D'ÁGUA CORPORATIVA CENTRALIZADA */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src={companyInfo.logoUrl || "/logo.png"}
            alt=""
            className="w-[320px] max-w-[55%] opacity-[0.035] grayscale select-none filter contrast-125"
          />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-between">
          {/* CABEÇALHO CORPORATIVO DA FÁBRICA */}
          <header className="border-b-2 border-black pb-1.5 mb-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                {/* LOGO DA EMPRESA NO TOPO */}
                <img
                  src={companyInfo.logoUrl || "/logo.png"}
                  alt={companyInfo.name || "Spa do Colchão"}
                  className="h-12 w-auto max-w-[90px] object-contain shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="bg-black text-white px-2 py-0.5 text-[7.5px] font-black uppercase tracking-widest rounded-none">
                      GUIA 1 DE 2: ORDEM DE PRODUÇÃO & CHÃO DE FÁBRICA
                    </span>
                    <span className="text-[7.5px] font-bold text-neutral-600 uppercase tracking-wider">
                      EMISSÃO: {formatDateTime(sale.saleDate || order.createdAt)}
                    </span>
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-black uppercase leading-none">
                    {companyInfo.name}
                  </h1>
                  <p className="text-[8.5px] font-black text-neutral-800 uppercase tracking-wider mt-0.5">
                    FICHA TÉCNICA INDUSTRIAL & ROTEIRO OPERACIONAL DE FABRICAÇÃO
                  </p>
                  <p className="text-[7.5px] text-neutral-600 mt-0.5">
                    CNPJ: {companyInfo.cnpj} • I.E: {companyInfo.stateRegistration || "91163387-66"} • {companyInfo.address}
                  </p>
                </div>
              </div>

              {/* BOX RETANGULAR DO NÚMERO DO PEDIDO */}
              <div className="border-2 border-black bg-neutral-50 p-1.5 min-w-[190px] text-right rounded-none shrink-0">
                <span className="text-[7px] font-black uppercase tracking-widest text-neutral-500 block">
                  Nº UNIFICADO DO PEDIDO
                </span>
                <span className="text-2xl font-black text-black tracking-tight block font-mono leading-none">
                  {orderNumberInfo.badgeNumber}
                </span>
                <div className="mt-1 pt-0.5 border-t border-black/30 flex justify-between text-[7.5px]">
                  <span className="font-bold text-neutral-600">Ref: {orderNumberInfo.reference}</span>
                  <span className="font-black text-black uppercase">{seller?.name || "Balcão / Loja"}</span>
                </div>
              </div>
            </div>
          </header>

          {/* 1. CRONOGRAMA OPERACIONAL & LOGÍSTICA DE RETIRADA & ENTREGA */}
          <section className="mb-1.5 border-2 border-black rounded-none bg-white">
            <div className="bg-black text-white px-2 py-0.5 flex items-center justify-between text-[7.5px] font-black uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="bg-white text-black px-1.5 py-0.2 font-black text-[7px]">ETAPA 1</span>
                <span>LOGÍSTICA OPERACIONAL DE RETIRADA & ENTREGA (EXPEDIÇÃO & TRANSPORTE)</span>
              </div>
              <span className="bg-neutral-800 px-1.5 py-0.2 text-[7px] font-mono">
                STATUS: {order.currentStatus === "SOLD" ? "VENDIDO / EM PRODUÇÃO" : order.currentStatus}
              </span>
            </div>

            <div className="p-1.5 grid grid-cols-12 gap-1.5 text-[7.5px] bg-white">
              {/* COLUNA 1: RETIRADA / COLETA AGENDADA (4 COLS) */}
              <div className={`col-span-4 p-1.5 border ${order.pickupDate ? "border-black bg-neutral-50" : "border-neutral-300 bg-neutral-50/50"} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between border-b border-black/20 pb-0.5 mb-1">
                    <span className="font-black text-black text-[7.5px] uppercase">📦 RETIRADA / COLETA</span>
                    <span className={`text-[6.5px] font-black px-1 py-0.2 ${order.pickupDate ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"}`}>
                      {order.pickupDate ? "COLETA NO CLIENTE" : "SEM COLETA"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase block">Data da Coleta:</span>
                      <span className="text-xs font-black text-black font-mono">
                        {order.pickupDate ? formatDate(order.pickupDate) : "---"}
                      </span>
                      {order.pickupDate && (
                        <span className="text-[7px] font-bold text-neutral-700 block">
                          Turno: {formatTimeOnly(order.pickupDate) || "Horário Comercial"}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase block">Local de Coleta:</span>
                      <p className="text-[7px] font-bold text-black leading-tight">
                        {order.pickupDate ? (
                          <>
                            {effectiveAddress.street ? `${effectiveAddress.street}, ${effectiveAddress.number}` : "Endereço do cliente"}
                            {effectiveAddress.neighborhood ? ` • ${effectiveAddress.neighborhood}` : ""}
                            {effectiveAddress.city ? ` • ${effectiveAddress.city}/${effectiveAddress.state}` : ""}
                          </>
                        ) : (
                          "Produto novo ou mercadoria entregue na fábrica pelo cliente."
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-0.5 mt-1 border-t border-neutral-300 text-[6.5px] text-neutral-600">
                  Responsável Coleta: <strong className="text-black">{customer?.fullName || "Cliente"}</strong>
                </div>
              </div>

              {/* COLUNA 2: ENTREGA / EXPEDIÇÃO AGENDADA (4 COLS) */}
              <div className={`col-span-4 p-1.5 border ${order.deliveryDate ? "border-black bg-neutral-50" : "border-neutral-300 bg-neutral-50/50"} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between border-b border-black/20 pb-0.5 mb-1">
                    <span className="font-black text-black text-[7.5px] uppercase">🚚 ENTREGA / EXPEDIÇÃO</span>
                    <span className={`text-[6.5px] font-black px-1 py-0.2 ${order.deliveryDate ? "bg-black text-white" : "bg-neutral-200 text-neutral-600"}`}>
                      {order.deliveryDate ? "EXPEDIÇÃO AGENDADA" : "A COMBINAR"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase block">Prazo / Data de Entrega:</span>
                      <span className="text-xs font-black text-black font-mono">
                        {order.deliveryDate ? formatDate(order.deliveryDate) : "A Combinar"}
                      </span>
                      {order.deliveryDate && (
                        <span className="text-[7px] font-bold text-neutral-700 block">
                          Turno: {formatTimeOnly(order.deliveryDate) || "Horário Comercial"}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase block">Endereço de Entrega:</span>
                      <p className="text-[7px] font-black text-black leading-tight">
                        {effectiveAddress.street}
                        {effectiveAddress.number ? `, ${effectiveAddress.number}` : ""}
                        {effectiveAddress.complement ? ` (${effectiveAddress.complement})` : ""}
                      </p>
                      <p className="text-[6.5px] text-neutral-700 leading-tight">
                        {effectiveAddress.neighborhood ? `${effectiveAddress.neighborhood}` : ""}
                        {effectiveAddress.city ? ` • ${effectiveAddress.city}/${effectiveAddress.state}` : ""}
                        {effectiveAddress.zipCode ? ` • CEP: ${effectiveAddress.zipCode}` : ""}
                      </p>
                      {effectiveAddress.reference && (
                        <p className="text-[6.5px] text-neutral-600 italic">
                          Ref: {effectiveAddress.reference}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-0.5 mt-1 border-t border-neutral-300 text-[6.5px] text-neutral-600 flex justify-between">
                  <span>Rota Própria de Fábrica</span>
                  <span>Conferência de Carga</span>
                </div>
              </div>

              {/* COLUNA 3: CONTATO NO LOCAL & INSTRUÇÕES DE ROTA (4 COLS) */}
              <div className="col-span-4 p-1.5 border border-black bg-neutral-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-black/20 pb-0.5 mb-1">
                    <span className="font-black text-black text-[7.5px] uppercase">📍 CONTATO & ROTA MOTORISTA</span>
                    <span className="text-[6.5px] font-bold text-neutral-600">INSTRUÇÕES</span>
                  </div>
                  <div className="space-y-0.5">
                    <div>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase block">Recebedor no Local:</span>
                      <span className="text-[8px] font-black text-black uppercase block">
                        {order.recipientName || customer?.fullName || "Cliente"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[6.5px] font-bold text-neutral-500 uppercase block">Telefone de Contato:</span>
                      <span className="text-[9px] font-black text-black font-mono block">
                        {order.recipientPhone || customer?.phone || "Não informado"}
                      </span>
                    </div>
                    {order.notes && (
                      <div className="bg-white p-1 border border-neutral-300 mt-0.5">
                        <span className="text-[6px] font-black uppercase text-neutral-600 block">Instruções / Acesso:</span>
                        <p className="text-[6.5px] font-bold text-black leading-tight line-clamp-2">
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-0.5 mt-1 border-t border-neutral-300 text-[6px] text-neutral-500 uppercase">
                  * Ligar com 30 min de antecedência antes da entrega
                </div>
              </div>
            </div>
          </section>

          {/* 2. ESPECIFICAÇÕES TÉCNICAS INDUSTRIAIS — DIVISÃO: COLCHÃO/CAMA & BASE BOX/SOMMIER */}
          <section className="mb-1.5 border-2 border-black rounded-none bg-white flex-1 flex flex-col justify-between">
            <div>
              <div className="bg-black text-white px-2 py-0.5 flex items-center justify-between text-[7.5px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="bg-white text-black px-1.5 py-0.2 font-black text-[7px]">ETAPA 2</span>
                  <span>FICHA TÉCNICA INDUSTRIAL — DIVISÃO: COLCHÃO/CAMA & BASE BOX/SOMMIER</span>
                </div>
                <span className="text-[7px] font-mono">
                  TOTAL: {factorySpecs.mattresses.length} COLCHÃO(ÕES) • {factorySpecs.boxes.length} BASE(S) BOX
                </span>
              </div>

              {/* GRID DE DUAS COLUNAS: COLCHÃO (ESQUERDA) VS BASE BOX (DIREITA) */}
              <div className="p-1.5 grid grid-cols-2 gap-1.5 text-[7.5px] bg-white">
                {/* COLUNA ESQUERDA: COLCHÃO / CAMA */}
                <div className="border border-black bg-white flex flex-col justify-between p-1.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between border-b-2 border-black pb-0.5 bg-neutral-100 p-1 -m-1.5 mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs leading-none">🛏️</span>
                        <span className="font-black text-black text-[8px] uppercase tracking-wide">
                          COLCHÃO / CAMA (CORTE & TAPEÇARIA)
                        </span>
                      </div>
                      <span className="bg-black text-white text-[6.5px] font-black px-1 py-0.2">
                        {factorySpecs.hasMattress ? `${factorySpecs.mattresses.length} ITEM(NS)` : "NÃO APLICÁVEL"}
                      </span>
                    </div>

                    {factorySpecs.hasMattress ? (
                      factorySpecs.mattresses.map((m, idx) => (
                        <div key={idx} className="space-y-1">
                          {/* Barra do Item do Colchão */}
                          <div className="flex items-center justify-between border-b border-neutral-300 pb-0.5">
                            <span className="font-black text-black uppercase text-[7.5px]">
                              {m.itemDescription}
                            </span>
                            <span className="font-mono font-black text-black text-[7.5px] bg-neutral-200 px-1">
                              QTD: {m.quantity} UN
                            </span>
                          </div>

                          {/* Medidas de Corte do Colchão */}
                          <div className="bg-neutral-50 p-1 border border-black/40">
                            <div className="flex justify-between items-center text-[6.5px] font-black text-neutral-600 uppercase mb-0.5">
                              <span>📏 MEDIDAS DE CORTE DO COLCHÃO</span>
                              <span>{m.commercialSize ? `PADRÃO: ${m.commercialSize.toUpperCase()}` : ""}</span>
                            </div>
                            <p className="text-sm font-black text-black font-mono tracking-tight leading-none">
                              {m.actualW > 0 ? `${m.actualW} x ${m.actualL} x ${m.actualH} cm` : "MEDIDAS PADRÃO DE LINHA"}
                            </p>
                            <div className="flex justify-between text-[6.5px] text-neutral-600 font-bold mt-0.5 pt-0.5 border-t border-neutral-200">
                              <span>Largura: <strong>{m.actualW} cm</strong></span>
                              <span>Comprimento: <strong>{m.actualL} cm</strong></span>
                              <span>Altura: <strong>{m.actualH} cm</strong></span>
                            </div>
                          </div>

                          {/* Materiais e Revestimentos */}
                          <div className="bg-neutral-50 p-1 border border-black/40 space-y-0.5">
                            <span className="font-black text-[6.5px] uppercase tracking-wider text-neutral-700 block border-b border-neutral-200 pb-0.5">
                              🧵 TECIDOS, ESPUMAS & ESTRUTURA
                            </span>
                            <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Tampo Superior:</span>
                                <span className="font-black text-black">{m.topFabric || m.topFabricColor || "Padrão"}</span>
                              </div>
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Faixa Lateral:</span>
                                <span className="font-black text-black">{m.sideFabric || m.sideFabricColor || "Padrão"}</span>
                              </div>
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Tampo Inferior:</span>
                                <span className="font-black text-black">{m.bottomFabric || m.bottomFabricColor || "Padrão / Antiderrapante"}</span>
                              </div>
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Estrutura / Molejo:</span>
                                <span className="font-black text-black">{m.mattressType || m.density || "Conforme padrão"}</span>
                              </div>
                              {m.tapeName && (
                                <div>
                                  <span className="text-[6px] font-bold text-neutral-500 uppercase block">Debrum / Fitilho:</span>
                                  <span className="font-black text-black">{m.tapeName}</span>
                                </div>
                              )}
                              {m.foamService && m.foamService !== "NENHUM" && (
                                <div>
                                  <span className="text-[6px] font-bold text-neutral-500 uppercase block">Pillow / Conforto:</span>
                                  <span className="font-black text-black">✦ {m.foamService} {m.addedFoamHeight ? `(+${m.addedFoamHeight}cm)` : ""}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Opções de Reforma se aplicável */}
                          {m.options.length > 0 && (
                            <div className="bg-neutral-100 p-1 border border-neutral-300 text-[6.5px]">
                              <span className="font-black uppercase text-[6px] text-neutral-700 block mb-0.5">
                                🔧 SERVIÇOS & INTERVENÇÕES EXECUTADAS:
                              </span>
                              <div className="flex flex-wrap gap-0.5">
                                {m.options.map((opt, oIdx) => (
                                  <span key={oIdx} className="bg-white border border-neutral-300 px-1 py-0.2 font-bold text-black">
                                    [X] {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Observações Técnicas do Colchão */}
                          {m.technicalNotes && (
                            <div className="bg-neutral-100 p-1 border border-neutral-300 text-[6.5px]">
                              <span className="font-black uppercase text-[6px] text-black block mb-0.5">
                                📝 NOTAS DO COLCHÃO:
                              </span>
                              <p className="font-medium text-black whitespace-pre-wrap">{m.technicalNotes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-neutral-400 bg-neutral-50 border border-dashed border-neutral-300">
                        <span className="block text-lg mb-0.5">🛏️</span>
                        <span className="text-[7.5px] font-black uppercase text-neutral-500 block">SEM COLCHÃO NESTE PEDIDO</span>
                        <p className="text-[6.5px] text-neutral-400">Este pedido não contém fabricação ou reforma de colchão.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 pt-0.5 border-t border-neutral-200 text-[6px] text-neutral-500 uppercase flex justify-between">
                    <span>Conferência Espuma & Tecido</span>
                    <span>Visto: ___________</span>
                  </div>
                </div>

                {/* COLUNA DIREITA: BASE BOX / SOMMIER */}
                <div className="border border-black bg-white flex flex-col justify-between p-1.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between border-b-2 border-black pb-0.5 bg-neutral-100 p-1 -m-1.5 mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs leading-none">📦</span>
                        <span className="font-black text-black text-[8px] uppercase tracking-wide">
                          BASE BOX / SOMMIER (MARCENARIA & ESTRUTURA)
                        </span>
                      </div>
                      <span className="bg-black text-white text-[6.5px] font-black px-1 py-0.2">
                        {factorySpecs.hasBox ? `${factorySpecs.boxes.length} ITEM(NS)` : "NÃO APLICÁVEL"}
                      </span>
                    </div>

                    {factorySpecs.hasBox ? (
                      factorySpecs.boxes.map((b, idx) => (
                        <div key={idx} className="space-y-1">
                          {/* Barra do Item do Box */}
                          <div className="flex items-center justify-between border-b border-neutral-300 pb-0.5">
                            <span className="font-black text-black uppercase text-[7.5px]">
                              {b.itemDescription}
                            </span>
                            <span className="font-mono font-black text-black text-[7.5px] bg-neutral-200 px-1">
                              QTD: {b.quantity} UN
                            </span>
                          </div>

                          {/* Medidas de Estrutura do Box */}
                          <div className="bg-neutral-50 p-1 border border-black/40">
                            <div className="flex justify-between items-center text-[6.5px] font-black text-neutral-600 uppercase mb-0.5">
                              <span>📏 MEDIDAS DE MADEIRAMENTO / BOX</span>
                              <span>{b.boxType ? `TIPO: ${b.boxType.toUpperCase()}` : "BOX PADRÃO"}</span>
                            </div>
                            <p className="text-sm font-black text-black font-mono tracking-tight leading-none">
                              {b.actualW > 0 ? (
                                <>
                                  {b.actualW} x {b.actualL} x {b.actualH} cm
                                  {b.isBipartido && (
                                    <span className="text-[7.5px] font-bold text-neutral-600 ml-1">
                                      (2 PEÇAS: 2x {b.actualW / 2}x{b.actualL}cm)
                                    </span>
                                  )}
                                </>
                              ) : (
                                "MEDIDAS PADRÃO DE LINHA"
                              )}
                            </p>
                            <div className="flex justify-between text-[6.5px] text-neutral-600 font-bold mt-0.5 pt-0.5 border-t border-neutral-200">
                              <span>Largura: <strong>{b.actualW} cm</strong></span>
                              <span>Comprimento: <strong>{b.actualL} cm</strong></span>
                              <span>Altura Box: <strong>{b.actualH} cm</strong></span>
                            </div>
                          </div>

                          {/* Revestimento e Componentes */}
                          <div className="bg-neutral-50 p-1 border border-black/40 space-y-0.5">
                            <span className="font-black text-[6.5px] uppercase tracking-wider text-neutral-700 block border-b border-neutral-200 pb-0.5">
                              🔨 ESTRUTURA, REVESTIMENTO & PÉS
                            </span>
                            <div className="grid grid-cols-2 gap-0.5 text-[7px]">
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Faixa Lateral Box:</span>
                                <span className="font-black text-black">{b.sideFabric || b.sideFabricColor || "Padrão"}</span>
                              </div>
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Tampo do Box:</span>
                                <span className="font-black text-black">{b.topFabric || "Antiderrapante / Padrão"}</span>
                              </div>
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Conjunto de Pés:</span>
                                <span className="font-black text-black">{b.feetName || "Madeira Maciça 12cm"}</span>
                              </div>
                              <div>
                                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Formato Base:</span>
                                <span className="font-black text-black">
                                  {b.isBipartido ? "Bipartido (2 partes)" : "Único (1 parte)"}
                                </span>
                              </div>
                              {b.tapeName && (
                                <div>
                                  <span className="text-[6px] font-bold text-neutral-500 uppercase block">Debrum Box:</span>
                                  <span className="font-black text-black">{b.tapeName}</span>
                                </div>
                              )}
                              {(b.hasStructureReinforce || b.hasHardwareRepl) && (
                                <div>
                                  <span className="text-[6px] font-bold text-neutral-500 uppercase block">Reforços:</span>
                                  <span className="font-black text-black">
                                    {b.hasStructureReinforce ? "✓ Reforço Madeira " : ""}
                                    {b.hasHardwareRepl ? "✓ Ferragens Especiais" : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Opções de Reforma de Box */}
                          {b.options.length > 0 && (
                            <div className="bg-neutral-100 p-1 border border-neutral-300 text-[6.5px]">
                              <span className="font-black uppercase text-[6px] text-neutral-700 block mb-0.5">
                                🔧 SERVIÇOS DE MARCENARIA EXECUTADOS:
                              </span>
                              <div className="flex flex-wrap gap-0.5">
                                {b.options.map((opt, oIdx) => (
                                  <span key={oIdx} className="bg-white border border-neutral-300 px-1 py-0.2 font-bold text-black">
                                    [X] {opt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Observações Técnicas do Box */}
                          {b.technicalNotes && (
                            <div className="bg-neutral-100 p-1 border border-neutral-300 text-[6.5px]">
                              <span className="font-black uppercase text-[6px] text-black block mb-0.5">
                                📝 NOTAS DA BASE BOX:
                              </span>
                              <p className="font-medium text-black whitespace-pre-wrap">{b.technicalNotes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-neutral-400 bg-neutral-50 border border-dashed border-neutral-300">
                        <span className="block text-lg mb-0.5">📦</span>
                        <span className="text-[7.5px] font-black uppercase text-neutral-500 block">SEM BASE BOX NESTE PEDIDO</span>
                        <p className="text-[6.5px] text-neutral-400">Este pedido não contém fabricação ou reforma de base box.</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 pt-0.5 border-t border-neutral-200 text-[6px] text-neutral-500 uppercase flex justify-between">
                    <span>Conferência Madeira & Pés</span>
                    <span>Visto: ___________</span>
                  </div>
                </div>
              </div>

              {/* SE HOUVER OUTROS ITENS / SERVIÇOS (Higienização, Cabeceira, Acessórios) */}
              {factorySpecs.others.length > 0 && (
                <div className="px-1.5 py-1 border-t border-neutral-300 bg-neutral-50 text-[7px]">
                  <span className="font-black uppercase text-black text-[6.5px] block mb-0.5">
                    ✦ ITENS ADICIONAIS & SERVIÇOS COMPLEMENTARES:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {factorySpecs.others.map((ot, idx) => (
                      <div key={idx} className="p-1 bg-white border border-neutral-300">
                        <div className="flex justify-between font-black text-black">
                          <span>{ot.quantity}x {ot.itemDescription}</span>
                          <span>{ot.type || "Serviço"}</span>
                        </div>
                        {ot.technicalNotes && <p className="text-[6.5px] text-neutral-600 mt-0.5">{ot.technicalNotes}</p>}
                        {ot.cleaningRows && ot.cleaningRows.length > 0 && (
                          <div className="mt-0.5 space-y-0.2">
                            {ot.cleaningRows.map((r, rIdx) => (
                              <span key={rIdx} className="text-[6px] text-neutral-700 block">
                                • {r.quantity}x {r.objectType} {r.observation ? `(${r.observation})` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. ROTEIRO DE FABRICAÇÃO & CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA) */}
          <section className="mb-1.5 border-2 border-black rounded-none bg-white">
            <div className="bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-wider flex justify-between">
              <span>3. ROTEIRO DE FABRICAÇÃO & CONTROLE DE QUALIDADE (4 FASES OPERACIONAIS)</span>
              <span>VISTO OBRIGATÓRIO DE CADA OPERADOR ANTES DE AVANÇAR</span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-black text-[7px]">
              <div className="p-1 flex flex-col justify-between">
                <div>
                  <span className="font-black text-black block">[ ] 1. MARCENARIA & ESTRUTURA</span>
                  <p className="text-[6px] text-neutral-600 mt-0.5">Esquadro, madeiras, travas e buchas dos pés.</p>
                </div>
                <div className="mt-1 pt-0.5 border-t border-neutral-300 space-y-0.2 text-[6.5px]">
                  <p className="text-neutral-700">Op: __________________</p>
                  <p className="text-neutral-700">Data: ___/___ Visto: ___</p>
                </div>
              </div>

              <div className="p-1 flex flex-col justify-between">
                <div>
                  <span className="font-black text-black block">[ ] 2. CORTE DE ESPUMA & NÚCLEO</span>
                  <p className="text-[6px] text-neutral-600 mt-0.5">Blocos, lâminas, pillow top e colagem do núcleo.</p>
                </div>
                <div className="mt-1 pt-0.5 border-t border-neutral-300 space-y-0.2 text-[6.5px]">
                  <p className="text-neutral-700">Op: __________________</p>
                  <p className="text-neutral-700">Data: ___/___ Visto: ___</p>
                </div>
              </div>

              <div className="p-1 flex flex-col justify-between">
                <div>
                  <span className="font-black text-black block">[ ] 3. TAPEÇARIA & FECHAMENTO</span>
                  <p className="text-[6px] text-neutral-600 mt-0.5">Tampos, faixas laterais, debrum/fitilho e grampos.</p>
                </div>
                <div className="mt-1 pt-0.5 border-t border-neutral-300 space-y-0.2 text-[6.5px]">
                  <p className="text-neutral-700">Op: __________________</p>
                  <p className="text-neutral-700">Data: ___/___ Visto: ___</p>
                </div>
              </div>

              <div className="p-1 flex flex-col justify-between">
                <div>
                  <span className="font-black text-black block">[ ] 4. INSPEÇÃO & EMBALAGEM</span>
                  <p className="text-[6px] text-neutral-600 mt-0.5">Inspeção visual, medidas finais e plástico grosso.</p>
                </div>
                <div className="mt-1 pt-0.5 border-t border-neutral-300 space-y-0.2 text-[6.5px]">
                  <p className="text-neutral-700">Op: __________________</p>
                  <p className="text-neutral-700">Data: ___/___ Visto: ___</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. PROTOCOLO DE LIBERAÇÃO INDUSTRIAL & EXPEDIÇÃO */}
          <section className="border border-black bg-neutral-50 p-1.5 text-[7px] mb-1">
            <div className="grid grid-cols-3 gap-2 items-center">
              <div>
                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Supervisor de Produção:</span>
                <div className="border-b border-black mt-2 pt-0.5">
                  <span className="text-[6.5px] text-neutral-600">Assinatura / Visto de Liberação</span>
                </div>
              </div>
              <div>
                <span className="text-[6px] font-bold text-neutral-500 uppercase block">Conferente de Expedição / Motorista:</span>
                <div className="border-b border-black mt-2 pt-0.5">
                  <span className="text-[6.5px] text-neutral-600">Assinatura do Recebedor na Carga</span>
                </div>
              </div>
              <div className="border border-black bg-white p-1 text-center">
                <span className="text-[6px] font-black uppercase text-neutral-600 block">CARIMBO DE LIBERAÇÃO</span>
                <span className="text-[7.5px] font-black text-black block font-mono">LIBERADO EXPEDIÇÃO</span>
                <span className="text-[6px] text-neutral-500">Data: ____/____/2026</span>
              </div>
            </div>
          </section>

          {/* RODAPÉ INDUSTRIAL */}
          <footer className="text-center pt-0.5 border-t border-black text-[6.5px] font-bold text-neutral-600 uppercase tracking-wider">
            DOCUMENTO INTERNO INDUSTRIAL • {companyInfo.name} • UNIDADE FABRIL • USO EXCLUSIVO DO CHÃO DE FÁBRICA • NÃO CONTÉM VALORES FINANCEIROS
          </footer>
        </div>
      </div>
    );
  };

  // =======================================================================
  // GUIA 2 DE 2: COMPROVANTE DO CLIENTE & TERMO DE GARANTIA
  // 1 FOLHA A4 COMPLETA E DEDICADA PARA O CLIENTE.
  // SEM COISAS DE DESTACAR OU PICOTES, COM PROTOCOLO DE RECEBIMENTO INTEGRAL.
  // =======================================================================
  // =======================================================================
  // GUIA 2 DE 2: COMPROVANTE DO CLIENTE & CERTIFICADO DE GARANTIA
  // 1 FOLHA A4 COMPLETA E DIVIDIDA EM:
  // - 50% DADOS DA COMPRA, CLIENTE, PAGAMENTO E PROTOCOLO DE RECEBIMENTO
  // - 50% CERTIFICADO OFICIAL DE GARANTIA (ABNT NBR 15413) & MANUAL DO USUÁRIO
  // =======================================================================
  const renderGuiaClienteGarantiaA4 = () => {
    return (
      <div
        className="guia-page guia-page-2 relative w-full max-w-[210mm] h-[284mm] max-h-[284mm] bg-white text-black font-sans mx-auto p-3 sm:p-3.5 border border-black rounded-none print:border-none print:p-0 print:m-0 text-[7.5px] leading-tight flex flex-col justify-between overflow-hidden"
      >
        {/* MARCA D'ÁGUA CORPORATIVA CENTRALIZADA */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src={companyInfo.logoUrl || "/logo.png"}
            alt=""
            className="w-[320px] max-w-[55%] opacity-[0.035] grayscale select-none filter contrast-125"
          />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
          {/* =================================================================== */}
          {/* METADE SUPERIOR (DADOS DA COMPRA, CLIENTE, PAGAMENTO & RECEBIMENTO) */}
          {/* =================================================================== */}
          <div className="h-[136mm] max-h-[136mm] flex flex-col justify-between border-b-2 border-black pb-1 mb-1 overflow-hidden">
            {/* CABEÇALHO CORPORATIVO DO PEDIDO */}
            <header className="border-b-2 border-black pb-1 mb-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {/* LOGO DA EMPRESA NO TOPO */}
                  <img
                    src={companyInfo.logoUrl || "/logo.png"}
                    alt={companyInfo.name || "Spa do Colchão"}
                    className="h-11 w-auto max-w-[85px] object-contain shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-black text-white px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded-none">
                        GUIA 2 DE 2: COMPROVANTE DO CLIENTE & GARANTIA
                      </span>
                      <span className="text-[7px] font-bold text-neutral-600 uppercase tracking-wider">
                        EMISSÃO: {formatDateTime(sale.saleDate || order.createdAt)}
                      </span>
                    </div>
                    <h1 className="text-lg font-black tracking-tight text-black uppercase leading-none">
                      {companyInfo.name}
                    </h1>
                    <p className="text-[8px] font-black text-neutral-800 uppercase tracking-wider mt-0.5">
                      COMPROVANTE DE PEDIDO & CERTIFICADO DE GARANTIA CONTRATUAL
                    </p>
                    <p className="text-[7px] text-neutral-600 mt-0.5">
                      CNPJ: {companyInfo.cnpj} • SAC / WhatsApp: {companyInfo.phone} • {companyInfo.address}
                    </p>
                  </div>
                </div>

                {/* BOX RETANGULAR DO NÚMERO DO PEDIDO */}
                <div className="border-2 border-black bg-neutral-50 p-1.5 min-w-[180px] text-right rounded-none shrink-0">
                  <span className="text-[6.5px] font-black uppercase tracking-widest text-neutral-500 block">
                    Nº UNIFICADO DO PEDIDO
                  </span>
                  <span className="text-xl font-black text-black tracking-tight block font-mono leading-none">
                    {orderNumberInfo.badgeNumber}
                  </span>
                  <div className="mt-1 pt-0.5 border-t border-black/30 flex justify-between text-[7px]">
                    <span className="font-bold text-neutral-600">Ref: {orderNumberInfo.reference}</span>
                    <span className="font-black text-black uppercase">{seller?.name || "Balcão / Loja"}</span>
                  </div>
                </div>
              </div>
            </header>

          {/* 1. DADOS DO CLIENTE & LOCAL DE ENTREGA */}
          <section className="mb-1 border border-black rounded-none bg-white">
            <div className="bg-black text-white px-2 py-0.5 flex items-center justify-between text-[7px] font-black uppercase tracking-wider">
              <span>1. IDENTIFICAÇÃO DO CLIENTE & LOCAL DE ENTREGA</span>
              <span>DATA DA COMPRA: {formatDate(sale.saleDate || order.createdAt)}</span>
            </div>

            <div className="p-1.5 grid grid-cols-12 gap-1.5 text-[7.5px] bg-white">
              <div className="col-span-4">
                <span className="font-bold text-neutral-500 uppercase text-[6.5px] block">Nome do Cliente:</span>
                <span className="font-black text-black uppercase text-[8px] truncate block">{customer?.fullName || "Cliente"}</span>
              </div>
              <div className="col-span-3">
                <span className="font-bold text-neutral-500 uppercase text-[6.5px] block">CPF / CNPJ:</span>
                <span className="font-bold text-neutral-900 font-mono text-[7.5px]">{customer?.document || "Não informado"}</span>
              </div>
              <div className="col-span-3">
                <span className="font-bold text-neutral-500 uppercase text-[6.5px] block">Telefone / WhatsApp:</span>
                <span className="font-bold text-neutral-900 font-mono text-[7.5px]">{customer?.phone || customer?.whatsapp || "Não informado"}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="font-bold text-neutral-500 uppercase text-[6.5px] block">Previsão Entrega:</span>
                <span className="font-black text-black font-mono text-[7.5px]">
                  {order.deliveryDate ? formatDate(order.deliveryDate) : "A combinar"}
                </span>
              </div>

              {/* Linha do Endereço Completo */}
              <div className="col-span-12 pt-0.5 border-t border-neutral-300 flex justify-between items-center text-[7px]">
                <div>
                  <span className="font-bold text-neutral-500 uppercase text-[6.5px] mr-1">Endereço de Entrega:</span>
                  <span className="font-bold text-black">
                    {effectiveAddress.street}
                    {effectiveAddress.number ? `, ${effectiveAddress.number}` : ""}
                    {effectiveAddress.complement ? ` (${effectiveAddress.complement})` : ""}
                    {effectiveAddress.neighborhood ? ` • Bairro: ${effectiveAddress.neighborhood}` : ""}
                    {effectiveAddress.city ? ` • ${effectiveAddress.city}/${effectiveAddress.state}` : ""}
                    {effectiveAddress.zipCode ? ` • CEP: ${effectiveAddress.zipCode}` : ""}
                  </span>
                </div>
                {effectiveAddress.reference && (
                  <span className="text-neutral-600 italic text-[6.5px]">Ref: {effectiveAddress.reference}</span>
                )}
              </div>
            </div>
          </section>

          {/* 2. DISCRIMINAÇÃO COMERCIAL DOS PRODUTOS & VALORES */}
          <section className="mb-1 border border-black rounded-none bg-white flex-1 flex flex-col justify-between">
            <div className="bg-black text-white px-2 py-0.5 flex items-center justify-between text-[7px] font-black uppercase tracking-wider">
              <span>2. DISCRIMINAÇÃO DOS PRODUTOS & ESPECIFICAÇÕES CONTRATADAS</span>
              <span>TOTAL DE ITENS: {items.length}</span>
            </div>

            <table className="w-full text-left text-[7.5px] border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-black border-b border-black text-[7px] uppercase font-black">
                  <th className="py-0.5 px-1.5 border-r border-neutral-300 w-7 text-center">Item</th>
                  <th className="py-0.5 px-1.5 border-r border-neutral-300">Descrição do Produto & Especificações Técnicas</th>
                  <th className="py-0.5 px-1.5 border-r border-neutral-300 text-center w-10">Qtd</th>
                  <th className="py-0.5 px-1.5 border-r border-neutral-300 text-right w-20">Valor Unit.</th>
                  <th className="py-0.5 px-1.5 text-right w-20">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {items.map((item: any, idx: number) => {
                  const specs = extractTechnicalSpecs(item);
                  return (
                    <tr key={item.id || idx} className="text-black">
                      <td className="py-0.5 px-1.5 font-black text-center border-r border-neutral-300 font-mono text-[7px]">
                        #{idx + 1}
                      </td>
                      <td className="py-0.5 px-1.5 border-r border-neutral-300">
                        <p className="font-black uppercase text-[7.5px] text-black leading-tight">{item.description}</p>
                        <p className="text-[6.5px] text-neutral-700 leading-tight">
                          {specs.actualW > 0 ? `Medidas: ${specs.actualW}x${specs.actualL}x${specs.actualH}cm • ` : ""}
                          {specs.topFabricName ? `Tampo: ${specs.topFabricName} • ` : ""}
                          {specs.sideFabricName ? `Lateral: ${specs.sideFabricName} • ` : ""}
                          {specs.density ? `Densidade: ${specs.density} • ` : ""}
                          {specs.foamService && specs.foamService !== "NENHUM" ? `Pillow: ${specs.foamService} • ` : ""}
                          {specs.boxType ? `Box: ${specs.boxType}` : ""}
                        </p>
                        {specs.technicalNotes && (
                          <p className="text-[6.5px] text-neutral-600 italic">
                            Obs: {specs.technicalNotes}
                          </p>
                        )}
                      </td>
                      <td className="py-0.5 px-1.5 text-center font-black border-r border-neutral-300 font-mono text-[7px]">
                        {item.quantity}
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-medium text-neutral-800 border-r border-neutral-300 font-mono text-[7px]">
                        {formatBRL(item.unitPrice)}
                      </td>
                      <td className="py-0.5 px-1.5 text-right font-black text-black font-mono text-[7.5px]">
                        {formatBRL(item.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* TOTALIZADORES E FORMAS DE PAGAMENTO */}
            <div className="border-t-2 border-black p-1.5 bg-neutral-50 grid grid-cols-2 gap-3 text-[7.5px]">
              {/* LADO ESQUERDO: FORMA DE PAGAMENTO */}
              <div className="border-r border-black/30 pr-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-neutral-700 uppercase text-[6.5px]">Condição de Pagamento:</span>
                  <span className="font-black uppercase text-[6.5px] px-1 py-0.2 bg-black text-white">
                    {sale.financialStatus === "PAID" ? "PAGO ANTECIPADO" : "A RECEBER NA ENTREGA"}
                  </span>
                </div>

                {installments.length > 0 ? (
                  <div className="space-y-0.5">
                    {installments.map((inst: any) => (
                      <div key={inst.id} className="flex justify-between items-center text-[7px] bg-white p-0.5 px-1 border border-neutral-300">
                        <span className="font-bold text-black">
                          {inst.installmentNumber}x {inst.paymentMethod?.name || "Pagamento"}
                        </span>
                        <span className="font-mono font-black text-black">{formatBRL(inst.amount)}</span>
                        <span className="text-neutral-500 text-[6.5px]">Venc: {formatDate(inst.dueDate)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[7px] font-bold text-neutral-700 bg-white p-0.5 px-1 border border-neutral-300">
                    Condição combinada no balcão / faturamento direto
                  </p>
                )}

                {/* NOTAS FINANCEIRAS / ENTRADA NO ATO */}
                {sale.notes && (
                  <p className="text-[6.5px] font-bold text-neutral-800 bg-white p-0.5 px-1 border border-neutral-300 line-clamp-2">
                    {sale.notes}
                  </p>
                )}
              </div>

              {/* LADO DIREITO: VALORES E TOTAIS */}
              <div className="flex flex-col justify-between pl-1">
                <div className="space-y-0.5 text-right text-[7.5px]">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal dos Produtos:</span>
                    <span className="font-mono font-bold text-black">{formatBRL(sale.subtotalAmount)}</span>
                  </div>
                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between text-neutral-700">
                      <span>Desconto Concedido:</span>
                      <span className="font-mono font-bold text-neutral-900">- {formatBRL(sale.discountAmount)}</span>
                    </div>
                  )}
                  {sale.surchargeAmount > 0 && (
                    <div className="flex justify-between text-neutral-700">
                      <span>Frete / Taxa de Entrega:</span>
                      <span className="font-mono font-bold text-neutral-900">+ {formatBRL(sale.surchargeAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-black pt-0.5 mt-0.5 flex justify-between items-baseline">
                  <span className="font-black text-[9px] uppercase tracking-tight text-black">TOTAL DO PEDIDO:</span>
                  <span className="text-sm font-black text-black font-mono tracking-tight">
                    {formatBRL(sale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 3. PROTOCOLO DE RECEBIMENTO & ASSINATURA DO CLIENTE */}
          <footer className="border border-black p-1 bg-neutral-50 rounded-none">
            <div className="flex items-center justify-between text-[6.5px] font-black uppercase tracking-wider text-black mb-0.5">
              <span>3. PROTOCOLO DE RECEBIMENTO & ACEITE DAS CONDIÇÕES</span>
              <span className="font-mono">{orderNumberInfo.badgeNumber}</span>
            </div>

            <p className="text-[6.5px] text-neutral-700 mb-0.5 leading-tight">
              Declaro ter recebido os produtos do <strong>{orderNumberInfo.badgeNumber}</strong> em perfeitas
              condições de uso, acabamento e medidas, conferi as especificações e estou ciente e de acordo com o
              <strong> Certificado de Garantia e Manual de Conservação</strong> estipulado integralmente abaixo.
            </p>

            <div className="grid grid-cols-4 gap-2 items-end pt-0.5">
              <div className="border-b border-black pb-0.5">
                <span className="text-[6px] text-neutral-500 uppercase block">Nome do Recebedor:</span>
                <span className="text-[7.5px] font-black uppercase text-black truncate block">
                  {order.recipientName || customer?.fullName || "___________________________"}
                </span>
              </div>
              <div className="border-b border-black pb-0.5">
                <span className="text-[6px] text-neutral-500 uppercase block">Documento (CPF / RG):</span>
                <span className="text-[7.5px] font-bold text-black font-mono">
                  {customer?.document || "___________________________"}
                </span>
              </div>
              <div className="border-b border-black pb-0.5 text-center">
                <span className="text-[6px] text-neutral-500 uppercase block">Data e Horário:</span>
                <span className="text-[7.5px] font-bold text-black font-mono">____ / ____ / 2026 às ____:____</span>
              </div>
              <div className="border-b border-black pb-0.5 text-center">
                <span className="text-[6px] text-neutral-500 uppercase block">Assinatura do Cliente:</span>
                <span className="text-[6.5px] text-neutral-400">Assinatura do Recebedor</span>
              </div>
            </div>
          </footer>
        </div>

        {/* =================================================================== */}
        {/* METADE INFERIOR (PELO MENOS 50% DO A4): CERTIFICADO OFICIAL DE GARANTIA & MANUAL */}
        {/* =================================================================== */}
        <div className="h-[146mm] min-h-[146mm] max-h-[146mm] flex flex-col justify-between border-2 border-black bg-white p-2.5 overflow-hidden">
          {/* CABEÇALHO OFICIAL DO CERTIFICADO DE GARANTIA */}
          <div className="bg-black text-white p-1.5 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-white text-black font-black text-[9px] px-2 py-0.5 tracking-wider">CERTIFICADO OFICIAL</span>
              <span className="font-black text-[10.5px] uppercase tracking-wider">
                TERMO DE GARANTIA & MANUAL DO USUÁRIO — SPA DO COLCHÃO
              </span>
            </div>
            <span className="text-[8px] font-mono text-neutral-200">
              ABNT NBR 15413 • VINCULADO AO {orderNumberInfo.badgeNumber}
            </span>
          </div>

          {/* GRID EM 3 COLUNAS OFICIAIS DE GARANTIA COM TEXTO AMPLIADO E ALTA LEGIBILIDADE */}
          <div className="grid grid-cols-3 divide-x-2 divide-black text-[8.5px] leading-snug flex-1">
            {/* COLUNA 1: 🛡️ PRAZOS E COBERTURA TÉCNICA */}
            <div className="pr-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="bg-neutral-100 border-b-2 border-black p-1.5 mb-1">
                  <span className="font-black text-black uppercase text-[9.5px] block">
                    🛡️ 1. PRAZOS LEGAIS & COBERTURA
                  </span>
                  <span className="text-[7.5px] font-bold text-neutral-600 block">Norma Técnica ABNT NBR 15413 & Código de Defesa do Consumidor</span>
                </div>

                <div className="space-y-1.5">
                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">✦ Molas & Estrutura de Madeira (12 Meses):</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      Garantia de <strong>12 meses (1 ano)</strong> contra quebra de molas, afundamento anormal do molejo (Pocket Ensacadas ou Bonnel), rompimento de arames de sustentação e trincas, rachaduras ou empenamento no chassi de madeira tratada da Base Box.
                    </p>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">✦ Espumas & Sustentação (12 Meses):</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      Garantia de <strong>12 meses (1 ano)</strong> contra perda prematura de resiliência, deformação excessiva e esfarelamento fora dos padrões fabris.
                    </p>
                  </div>

                  <div className="border-2 border-black bg-neutral-100 p-1.5">
                    <span className="font-black text-black uppercase text-[9px] block">⚖️ Tolerância Técnica ABNT NBR 15413:</span>
                    <p className="text-[8.5px] text-neutral-950 mt-0.5 leading-snug">
                      Todo colchão sofre amaciamento natural nas regiões de maior pressão corporal (quadril e ombros). Acomodação de <strong>até 10% da altura original</strong> é processo físico normal das espumas e fibras, <strong>não configurando defeito de fabricação</strong>.
                    </p>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">✦ Tecidos & Costuras (90 Dias):</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      Garantia legal de <strong>90 dias</strong> (Art. 26 do CDC) para defeitos de tecelagem, desfiamento espontâneo de costuras e debrum.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 mt-1 border-t border-neutral-400 text-[7px] font-bold text-neutral-600 uppercase">
                Garantia vinculada ao {orderNumberInfo.simplified}
              </div>
            </div>

            {/* COLUNA 2: 🔄 MANUAL DE CONSERVAÇÃO & CRONOGRAMA DE GIRO */}
            <div className="px-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="bg-neutral-100 border-b-2 border-black p-1.5 mb-1">
                  <span className="font-black text-black uppercase text-[9.5px] block">
                    🔄 2. CONSERVAÇÃO & GIRO OBRIGATÓRIO
                  </span>
                  <span className="text-[7.5px] font-bold text-neutral-600 block">Procedimentos indispensáveis para preservar a vida útil do produto</span>
                </div>

                <div className="space-y-1.5">
                  <div className="border-2 border-black bg-neutral-100 p-1.5">
                    <span className="font-black text-black uppercase text-[9px] block">🔄 Cronograma Obrigatório de Rotação (Giro):</span>
                    <div className="text-[8.5px] text-neutral-950 mt-0.5 leading-snug space-y-0.5">
                      <p>• <strong>Primeiros 90 dias (3 meses):</strong> Girar no sentido cabeça/pés a cada <strong>15 dias</strong> impreterivelmente.</p>
                      <p>• <strong>Do 4º mês em diante:</strong> Girar em <strong>180° mensalmente</strong>.</p>
                      <p className="text-[8px] text-neutral-700 italic mt-0.5">A rotação equaliza o peso corporal e é condição indispensável da garantia.</p>
                    </div>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">✦ Base de Apoio Adequada:</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      O colchão deve repousar exclusivamente sobre base box uniforme ou estrado plano e nivelado, com vão livre máximo de <strong>5 cm entre as ripas</strong>. Estrados arqueados ou ripas quebradas invalidam a garantia.
                    </p>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">✦ Proteção Higiênica Impermeável:</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      É mandatório o <strong>uso permanente de capa protetora impermeável</strong>. A penetração de suor, água ou urina destrói as células da espuma e oxida o molejo.
                    </p>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">✦ Ventilação & Proibições:</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      Manter o quarto arejado. Proibido dobrar o colchão, nunca colocar ferro quente sobre o tecido e proibir saltos (pulos).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 mt-1 border-t border-neutral-400 text-[7px] font-bold text-neutral-600 uppercase">
                O não cumprimento do giro compromete o núcleo
              </div>
            </div>

            {/* COLUNA 3: ⚠️ EXCLUSÕES & ASSISTÊNCIA TÉCNICA (SAC) */}
            <div className="pl-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="bg-neutral-100 border-b-2 border-black p-1.5 mb-1">
                  <span className="font-black text-black uppercase text-[9.5px] block">
                    ⚠️ 3. HIPÓTESES DE EXCLUSÃO & SAC
                  </span>
                  <span className="text-[7.5px] font-bold text-neutral-600 block">Condições de perda de cobertura e assistência pós-venda</span>
                </div>

                <div className="space-y-1.5">
                  <div className="border-2 border-black bg-rose-50/70 p-1.5 border-dashed">
                    <span className="font-black text-rose-950 uppercase text-[9px] block">🚫 Hipóteses de Perda da Garantia:</span>
                    <div className="text-[8.5px] text-neutral-950 mt-0.5 leading-snug space-y-0.5">
                      <p>• <strong>Manchas ou Umidade:</strong> Presença de urina, suor excessivo, bebidas, mofo ou químicos (invalidação sanitária imediata).</p>
                      <p>• <strong>Estrado Inadequado:</strong> Deformações causadas por estrados com ripas espaçadas &gt; 5cm ou bases tortas.</p>
                      <p>• <strong>Dano Físico:</strong> Rasgos, furos por objetos pontiagudos, queimaduras ou animais domésticos.</p>
                      <p>• <strong>Etiqueta Removida:</strong> Violação, corte ou rasura da etiqueta e série da fábrica.</p>
                    </div>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">📞 Como Acionar a Assistência Técnica (SAC):</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      1. Enviar mensagem para o WhatsApp/SAC: <strong className="font-mono text-black">{companyInfo.phone}</strong> informando o <strong>{orderNumberInfo.badgeNumber}</strong>.
                      <br/>
                      2. Enviar fotos claras do produto e vídeo colocando uma régua rígida sobre a área para aferição da acomodação.
                    </p>
                  </div>

                  <div className="border border-black p-1.5 bg-neutral-50">
                    <span className="font-black text-black uppercase text-[9px] block">⏱️ Vistoria Técnica no Prazo Legal (CDC):</span>
                    <p className="text-[8.5px] text-neutral-900 mt-0.5 leading-snug">
                      A Spa do Colchão realizará vistoria técnica domiciliar ou fabril no prazo legal de até <strong>30 dias corridos</strong>, conforme estipulado no Artigo 18 da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 mt-1 border-t border-neutral-400 text-[7px] font-bold text-neutral-600 uppercase">
                Atendimento SAC de Segunda a Sexta das 08h às 18h
              </div>
            </div>
          </div>

          {/* RODAPÉ DO CERTIFICADO OFICIAL */}
          <div className="mt-1.5 pt-1 border-t-2 border-black flex items-center justify-between text-[7.5px] font-black text-black uppercase">
            <span>{companyInfo.legalName || companyInfo.name} • INDÚSTRIA & REFORMA ESPECIALIZADA • CNPJ: {companyInfo.cnpj}</span>
            <span>CERTIFICADO VINCULADO AO PEDIDO {orderNumberInfo.badgeNumber} • VALIDADE NACIONAL</span>
          </div>
        </div>
      </div>
    </div>
    );
  };

  // =======================================================================
  // RENDERIZAÇÃO TÉRMICA 80MM (CUPOM COMPACTO)
  // =======================================================================
  const renderThermalSlip = () => {
    return (
      <div className="w-[80mm] max-w-[80mm] bg-white text-black font-sans mx-auto p-2 text-[10px] leading-tight border border-black rounded-none">
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <img
            src={companyInfo.logoUrl || "/logo.png"}
            alt={companyInfo.name || "Spa do Colchão"}
            className="h-9 w-auto mx-auto mb-1 object-contain"
          />
          <span className="text-[8px] font-black uppercase text-neutral-600 block">{companyInfo.name}</span>
          <h1 className="text-lg font-black uppercase text-black font-mono">{orderNumberInfo.badgeNumber}</h1>
          <p className="text-[8px] font-bold text-neutral-800 uppercase">Comprovante de Pedido & Garantia</p>
          <p className="text-[8px] text-neutral-500">
            CNPJ: {companyInfo.cnpj} • Ref: {orderNumberInfo.reference} • {formatDateTime(sale.saleDate || order.createdAt)}
          </p>
        </div>

        {/* LOGÍSTICA AGENDADA */}
        <div className="mb-2 p-1.5 bg-neutral-50 border border-black text-[9px] space-y-1">
          {order.pickupDate && (
            <p className="font-bold text-black">
              Retirada: <span className="font-black">{formatDate(order.pickupDate)}</span>
            </p>
          )}
          {order.deliveryDate && (
            <p className="font-bold text-black">
              Entrega: <span className="font-black">{formatDate(order.deliveryDate)}</span>
            </p>
          )}
          {order.notes && <p className="text-[8px] text-neutral-700">Obs: {order.notes}</p>}
        </div>

        {/* CLIENTE */}
        <div className="mb-2 text-[9px] border-b border-black/40 pb-1">
          <p className="font-black uppercase">{customer?.fullName}</p>
          {customer?.phone && <p className="text-neutral-700 font-mono">Tel: {customer.phone}</p>}
          {mainAddress && (
            <p className="text-neutral-700 text-[8px] leading-none mt-0.5">
              {mainAddress.street}, {mainAddress.number} - {mainAddress.neighborhood}
            </p>
          )}
        </div>

        {/* ITENS */}
        <div className="mb-2 border-b border-black/40 pb-2 space-y-1.5">
          <p className="text-[8px] font-black uppercase text-neutral-600">Itens e Especificações:</p>
          {items.map((item: any, idx: number) => {
            const specs = extractTechnicalSpecs(item);
            return (
              <div key={idx} className="text-[9px]">
                <div className="flex justify-between font-black">
                  <span>
                    {item.quantity}x {item.description}
                  </span>
                  <span className="font-mono">{formatBRL(item.totalAmount)}</span>
                </div>
                {specs.actualW > 0 && (
                  <p className="text-[8px] font-bold text-neutral-700 font-mono">
                    Medidas: {specs.actualW}x{specs.actualL}x{specs.actualH}cm
                  </p>
                )}
                {specs.topFabricName && (
                  <p className="text-[8px] text-neutral-700">
                    Tecido: {specs.topFabricName} / {specs.sideFabricName || "Padrão"}
                  </p>
                )}
                {specs.technicalNotes && (
                  <p className="text-[8px] text-neutral-700 bg-neutral-100 p-1 border border-neutral-300 mt-0.5 leading-tight">
                    {specs.technicalNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* TOTAL */}
        <div className="mb-2 flex justify-between font-black text-sm border-b-2 border-black pb-1 font-mono">
          <span>TOTAL:</span>
          <span>{formatBRL(sale.totalAmount)}</span>
        </div>

        {/* TERMO DE GARANTIA RESUMIDO */}
        <div className="mb-2 p-1.5 bg-neutral-50 border border-black/40 text-[8px] text-neutral-700 leading-tight">
          <p className="font-black text-black uppercase">Garantia Spa do Colchão:</p>
          <p>• 1 ano para estrutura de molas e madeiramento.</p>
          <p>• 1 ano para espumas (conforme ABNT NBR 15413, assentamento de até 10% é natural).</p>
          <p>• 90 dias para costuras e tecidos. Giro quinzenal nos primeiros 3 meses.</p>
        </div>

        {/* ASSINATURA */}
        <div className="pt-2 text-center text-[8px] text-neutral-600">
          <p className="mb-2">Recebi os produtos em perfeitas condições e concordo com os termos.</p>
          <div className="border-t border-black pt-1">
            <p className="font-bold text-black uppercase">{customer?.fullName || "Assinatura do Cliente"}</p>
          </div>
        </div>
      </div>
    );
  };

  if (format === "thermal") {
    return (
      <div className="order-print-container w-full">
        {renderThermalSlip()}
      </div>
    );
  }

  // =======================================================================
  // FORMATO A4 COM EXATAMENTE UMA FOLHA A4 PARA CADA GUIA
  // GUIA 1 (FOLHA A4 1): PRODUÇÃO / FICHA TÉCNICA
  // GUIA 2 (FOLHA A4 2): COMPROVANTE DO CLIENTE & TERMO DE GARANTIA
  // =======================================================================
  return (
    <div className="order-print-container w-full space-y-6 print:space-y-0">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          .guia-page {
            position: relative !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 194mm !important;
            height: 284mm !important;
            max-height: 284mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 0 !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .guia-has-next-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .guia-page-2 {
            page-break-before: auto !important;
            break-before: auto !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>

      {/* 1. GUIA DE PRODUÇÃO (FOLHA A4 1) */}
      {showGuia1 && renderGuiaProducaoA4()}

      {/* DIVISOR VISUAL ENTRE FOLHAS NA TELA DO SISTEMA */}
      {showGuia1 && showGuia2 && (
        <div className="no-print my-6 flex items-center justify-center gap-3 text-slate-400">
          <div className="h-px bg-slate-300 flex-1 max-w-[210mm]" />
          <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-3.5 py-1 border border-black rounded-none shadow-sm">
            FOLHA 2 (A4): GUIA DO CLIENTE & TERMO DE GARANTIA
          </span>
          <div className="h-px bg-slate-300 flex-1 max-w-[210mm]" />
        </div>
      )}

      {/* 2. GUIA DO CLIENTE COM COMPROVANTE COMPLETO + TERMO DE GARANTIA (FOLHA A4 2) */}
      {showGuia2 && renderGuiaClienteGarantiaA4()}
    </div>
  );
}
