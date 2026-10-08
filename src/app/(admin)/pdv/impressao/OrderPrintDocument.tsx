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
    cnpj?: string;
    phone?: string;
    address?: string;
    email?: string;
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
// COMPONENTE PRINCIPAL
// =========================================================================

export function OrderPrintDocument({
  order,
  format = "a4",
  guiaMode = "both",
  copies = 2,
  companyInfo = {
    name: "SPA DO COLCHÃO",
    tradeName: "Indústria & Reforma Especializada de Colchões",
    cnpj: "00.000.000/0001-00",
    phone: "(11) 99999-9999",
    address: "Fábrica e Loja Especializada",
    email: "contato@spadocolchao.com.br",
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
  // SEM VALORES FINANCEIROS, PREÇOS OU COISAS DE DESTACAR.
  // =======================================================================
  const renderGuiaProducaoA4 = () => {
    return (
      <div
        className={`guia-page guia-page-1 ${
          showGuia2 ? "guia-has-next-page" : ""
        } w-full max-w-[210mm] min-h-[297mm] print:min-h-0 bg-white text-slate-900 font-sans mx-auto p-4 sm:p-5 shadow-sm border border-slate-300 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 text-[9px] leading-tight flex flex-col justify-between`}
      >
        <div className="flex-1 flex flex-col">
          {/* CABEÇALHO DA PRODUÇÃO */}
          <header className="border-b-2 border-slate-950 pb-1.5 mb-1.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] font-black uppercase tracking-widest bg-slate-950 text-white px-2 py-0.5 rounded">
                  GUIA 1 DE 2: ORDEM DE PRODUÇÃO & CHÃO DE FÁBRICA
                </span>
                <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Emissão: {formatDateTime(sale.saleDate || order.createdAt)}
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase mt-0.5">
                {companyInfo.name}
              </h1>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">
                FICHA TÉCNICA DE FABRICAÇÃO & ROTEIRO OPERACIONAL
              </p>
              <p className="text-[8px] text-slate-500 mt-0.5">
                CNPJ: {companyInfo.cnpj} • Fábrica e Produção Sob Medida
              </p>
            </div>

            {/* BOX NÚMERO UNIFICADO DO PEDIDO */}
            <div className="text-right border-2 border-slate-950 bg-slate-50 rounded-xl p-2 min-w-[190px]">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">
                Nº UNIFICADO DO PEDIDO
              </span>
              <span className="text-xl font-black text-slate-950 tracking-tight block font-mono">
                {orderNumberInfo.badgeNumber}
              </span>
              <div className="mt-0.5 pt-0.5 border-t border-slate-300 flex justify-between text-[8px]">
                <span className="text-slate-500 font-bold">Ref: {orderNumberInfo.reference}</span>
                <span className="font-black text-slate-900">{seller?.name || "Balcão / Loja"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BLOCO 1: CRONOGRAMA DE PRODUÇÃO & LOGÍSTICA AGENDADA */}
        <section className="mb-2 border-2 border-slate-950 rounded-xl overflow-hidden">
          <div className="bg-slate-950 text-white px-2.5 py-0.5 flex items-center justify-between text-[8.5px] font-black uppercase tracking-wider">
            <span>1. CRONOGRAMA DE PRODUÇÃO & LOGÍSTICA AGENDADA</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[7.5px]">
              Status: {order.currentStatus === "SOLD" ? "Vendido / Em Produção" : order.currentStatus}
            </span>
          </div>

          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-50/70">
            {/* RETIRADA */}
            <div
              className={`p-1.5 rounded-lg border ${
                order.pickupDate ? "bg-amber-50/90 border-amber-300" : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8.5px] font-black uppercase text-amber-950">📦 RETIRADA AGENDADA (COLETA)</span>
                <span className="text-[7.5px] font-bold text-amber-800">
                  {order.pickupDate ? "Coleta no Cliente" : "Não aplicável"}
                </span>
              </div>
              <p className="text-sm font-black text-amber-950">
                {order.pickupDate ? formatDate(order.pickupDate) : "Sem coleta agendada"}
              </p>
              {order.pickupDate && (
                <p className="text-[8px] font-bold text-amber-900 mt-0.5">
                  Horário: {formatTimeOnly(order.pickupDate) || "Comercial"}
                </p>
              )}
            </div>

            {/* ENTREGA */}
            <div
              className={`p-1.5 rounded-lg border ${
                order.deliveryDate ? "bg-emerald-50/90 border-emerald-300" : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8.5px] font-black uppercase text-emerald-950">
                  🚚 DATA LIMITE DE ENTREGA (EXPEDIÇÃO FÁBRICA)
                </span>
                <span className="text-[7.5px] font-bold text-emerald-800">
                  {order.deliveryDate ? "Prazo Fatal Produção" : "A Definir"}
                </span>
              </div>
              <p className="text-sm font-black text-emerald-950">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "Sem data agendada"}
              </p>
              {order.deliveryDate && (
                <p className="text-[8px] font-bold text-emerald-900 mt-0.5">
                  Horário / Turno: {formatTimeOnly(order.deliveryDate) || "Comercial"}
                </p>
              )}
            </div>

            {/* IDENTIFICAÇÃO BÁSICA PARA EXPEDIÇÃO */}
            <div className="md:col-span-2 pt-0.5 border-t border-slate-200 text-[9px] space-y-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-600">Cliente / Destinatário: </span>
                  <span className="font-black text-slate-900 uppercase">
                    {order.recipientName || customer?.fullName || "Cliente"}
                  </span>
                  {customer?.phone && (
                    <span className="text-slate-600 ml-2">
                      • Contato: <span className="font-black text-slate-800">{customer.phone}</span>
                    </span>
                  )}
                </div>
                {mainAddress && (
                  <div>
                    <span className="font-bold text-slate-600">Região de Entrega: </span>
                    <span className="font-black text-slate-900 uppercase">
                      {mainAddress.neighborhood} - {mainAddress.city}/{mainAddress.state}
                    </span>
                  </div>
                )}
              </div>
              {order.notes && (
                <div className="bg-white p-1 rounded border border-slate-200 text-slate-800">
                  <span className="font-black text-slate-950 uppercase text-[8px] block">
                    Observações de Logística / Rota da Fábrica:
                  </span>
                  <span className="font-medium text-[8.5px]">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOCO 2: ESPECIFICAÇÕES TÉCNICAS DOS PRODUTOS (CHÃO DE FÁBRICA) */}
        <section className="mb-2 border-2 border-slate-950 rounded-xl overflow-hidden">
          <div className="bg-slate-950 text-white px-2.5 py-0.5 flex items-center justify-between text-[8.5px] font-black uppercase tracking-wider">
            <span>2. ESPECIFICAÇÕES TÉCNICAS DE FABRICAÇÃO / REFORMA (CHÃO DE FÁBRICA)</span>
            <span>TOTAL DE ITENS: {items.length}</span>
          </div>

          <div className="divide-y-2 divide-slate-300">
            {items.map((item: any, idx: number) => {
              const specs = extractTechnicalSpecs(item);

              return (
                <div key={item.id || idx} className="p-2 bg-white space-y-1.5">
                  {/* Cabeçalho do Item */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-950 text-white text-[9.5px] font-black px-1.5 py-0.5 rounded">
                        ITEM #{idx + 1}
                      </span>
                      <h3 className="text-xs font-black text-slate-950 uppercase tracking-tight">
                        {item.description}
                      </h3>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">
                        ({item.productService?.type || item.type || "Fabricação Própria"})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="bg-slate-950 text-white font-black text-xs px-2 py-0.5 rounded-lg inline-block">
                        QTD: {item.quantity} UN
                      </span>
                    </div>
                  </div>

                  {/* GRID TÉCNICA DO CHÃO DE FÁBRICA */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 text-[9px]">
                    {/* MEDIDAS DE CORTE (4 COLUNAS) */}
                    <div className="md:col-span-4 bg-slate-100 p-1.5 rounded-lg border border-slate-300">
                      <span className="font-black text-[8px] uppercase tracking-wider text-slate-700 block mb-0.5">
                        📏 MEDIDAS DE CORTE & ESTRUTURA
                      </span>
                      {specs.actualW > 0 || specs.actualL > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-950 font-mono tracking-tight">
                            {specs.actualW} x {specs.actualL} {specs.actualH > 0 ? `x ${specs.actualH}` : ""} cm
                          </p>
                          <p className="text-[8px] font-bold text-slate-600">
                            Largura: {specs.actualW}cm • Comprimento: {specs.actualL}cm{" "}
                            {specs.actualH > 0 ? `• Altura: ${specs.actualH}cm` : ""}
                          </p>
                          {specs.commercialSize && (
                            <p className="text-[8px] font-black text-blue-900 uppercase">
                              Padrão: {specs.commercialSize}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="font-bold text-slate-700">Dimensões padrão de catálogo</p>
                      )}
                    </div>

                    {/* REVESTIMENTOS ESCOLHIDOS (8 COLUNAS) */}
                    <div className="md:col-span-8 bg-blue-50/70 p-1.5 rounded-lg border border-blue-200">
                      <span className="font-black text-[8px] uppercase tracking-wider text-blue-950 block mb-0.5">
                        🧵 REVESTIMENTOS ESCOLHIDOS NO PDV
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {/* Tampo */}
                        <div>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Tecido Tampo</span>
                          <span className="font-black text-slate-900">
                            {specs.topFabricName || specs.topColor || "Padrão da Linha"}
                          </span>
                        </div>
                        {/* Faixa Lateral */}
                        <div>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Faixa Lateral</span>
                          <span className="font-black text-slate-900">
                            {specs.sideFabricName || specs.sideColor || "Padrão da Linha"}
                          </span>
                        </div>
                        {/* Densidade / Núcleo */}
                        <div>
                          <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Densidade / Núcleo</span>
                          <span className="font-black text-slate-900">
                            {specs.density || specs.mattressType || "Conforme ficha"}
                          </span>
                        </div>
                        {/* Tecido Inferior */}
                        {specs.bottomFabricName && (
                          <div>
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Tecido Inferior</span>
                            <span className="font-black text-slate-900">{specs.bottomFabricName}</span>
                          </div>
                        )}
                        {/* Fitilho / Debrum */}
                        {specs.tapeName && (
                          <div>
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Fitilho / Debrum</span>
                            <span className="font-black text-slate-900">{specs.tapeName}</span>
                          </div>
                        )}
                        {/* Camada Extra / Pillow */}
                        {specs.foamService && specs.foamService !== "NENHUM" && (
                          <div className="sm:col-span-2">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Pillow / Conforto</span>
                            <span className="font-black text-emerald-950">
                              ✦ {specs.foamService} {specs.addedFoamHeight ? `(+${specs.addedFoamHeight} cm)` : ""}
                            </span>
                          </div>
                        )}
                        {/* Box / Pés */}
                        {(specs.boxType || specs.feetName) && (
                          <div className="sm:col-span-3 pt-0.5 border-t border-blue-200/80">
                            <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Box & Pés</span>
                            <span className="font-black text-amber-950">
                              Tipo: {(specs.boxType || "Comum").toUpperCase()}
                              {specs.hasStructureReinforce ? " • Reforço Estrutural" : ""}
                              {specs.hasHardwareRepl ? " • Ferragens Especiais" : ""}
                              {specs.feetName ? ` • Pés: ${specs.feetName}` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* NOTAS TÉCNICAS E ESCOLHAS DIGITADAS NO PDV */}
                  {specs.technicalNotes && (
                    <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-1.5 text-[9px] text-amber-950">
                      <span className="font-black uppercase tracking-wider text-[7.5px] text-amber-900 block mb-0.5">
                        📝 NOTAS TÉCNICAS & ESCOLHAS PERSONALIZADAS DO CLIENTE NO PDV:
                      </span>
                      <p className="font-medium whitespace-pre-wrap">{specs.technicalNotes}</p>
                    </div>
                  )}

                  {/* HIGIENIZAÇÃO */}
                  {specs.cleaningRows.length > 0 && (
                    <div className="bg-teal-50/70 border border-teal-300 rounded-lg p-1.5 text-[8px] text-teal-950">
                      <span className="font-black uppercase tracking-wider text-[7.5px] text-teal-900 block mb-0.5">
                        🧼 ESPECIFICAÇÃO DE HIGIENIZAÇÃO / IMPERMEABILIZAÇÃO:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {specs.cleaningRows.map((row: any, rIdx: number) => (
                          <div key={row.id || rIdx} className="bg-white p-1 rounded border border-teal-200">
                            <span className="font-black text-teal-900">
                              {row.quantity}x {row.objectType}
                            </span>
                            {row.observation && <p className="text-[7px] text-slate-500">{row.observation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        </div>

        {/* PARTE INFERIOR: CONTROLE DE QUALIDADE E RODAPÉ */}
        <div className="mt-1 pt-0.5">
          {/* BLOCO 3: ROTEIRO DE CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA) */}
          <section className="mb-1 border border-slate-400 rounded-xl p-1.5 bg-white">
            <div className="text-[8px] font-black uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
              <span>3. ROTEIRO DE FABRICAÇÃO & CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA)</span>
              <span>VISTO OBRIGATÓRIO DOS OPERADORES</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[8px]">
              <div className="border border-slate-200 rounded p-1 bg-slate-50">
                <span className="font-bold text-slate-800 block">[ ] 1. Marcenaria & Estrutura</span>
                <p className="text-[7px] text-slate-500 mt-0.5">Resp: ___________________</p>
                <p className="text-[7px] text-slate-500">Data: ___/___/2026</p>
              </div>
              <div className="border border-slate-200 rounded p-1 bg-slate-50">
                <span className="font-bold text-slate-800 block">[ ] 2. Corte de Espuma & Bloco</span>
                <p className="text-[7px] text-slate-500 mt-0.5">Resp: ___________________</p>
                <p className="text-[7px] text-slate-500">Data: ___/___/2026</p>
              </div>
              <div className="border border-slate-200 rounded p-1 bg-slate-50">
                <span className="font-bold text-slate-800 block">[ ] 3. Tapeçaria, Costura & Debrum</span>
                <p className="text-[7px] text-slate-500 mt-0.5">Resp: ___________________</p>
                <p className="text-[7px] text-slate-500">Data: ___/___/2026</p>
              </div>
              <div className="border border-slate-200 rounded p-1 bg-slate-50">
                <span className="font-bold text-slate-800 block">[ ] 4. Qualidade Final & Embalagem</span>
                <p className="text-[7px] text-slate-500 mt-0.5">Resp: ___________________</p>
                <p className="text-[7px] text-slate-500">Data: ___/___/2026</p>
              </div>
            </div>
          </section>

          {/* RODAPÉ */}
          <footer className="text-center pt-0.5 border-t border-slate-300 text-[7px] font-bold text-slate-500 uppercase tracking-wider">
            DOCUMENTO INTERNO DE PRODUÇÃO • NÃO CONTÉM DADOS FINANCEIROS • {companyInfo.name}
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
  const renderGuiaClienteGarantiaA4 = () => {
    return (
      <div
        className="guia-page guia-page-2 w-full max-w-[210mm] min-h-[297mm] print:min-h-0 bg-white text-slate-900 font-sans mx-auto p-4 sm:p-5 shadow-sm border border-slate-300 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 text-[8.5px] leading-tight flex flex-col justify-between"
      >
        <div className="flex-1 flex flex-col">
          {/* CABEÇALHO DA GUIA DO CLIENTE */}
          <header className="border-b-2 border-slate-950 pb-1.5 mb-1.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] font-black uppercase tracking-widest bg-blue-900 text-white px-2 py-0.5 rounded">
                  GUIA 2 DE 2: COMPROVANTE DO CLIENTE & TERMO DE GARANTIA
                </span>
                <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                  Emissão: {formatDateTime(sale.saleDate || order.createdAt)}
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase mt-0.5">
                {companyInfo.name}
              </h1>
              <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wide">
                COMPROVANTE DE PEDIDO, DISCRIMINAÇÃO COMERCIAL & CERTIFICADO DE GARANTIA
              </p>
              <p className="text-[8px] text-slate-500 mt-0.5">
                CNPJ: {companyInfo.cnpj} • Contato / SAC: {companyInfo.phone}
              </p>
            </div>

            {/* BOX NÚMERO UNIFICADO DO PEDIDO */}
            <div className="text-right border-2 border-slate-950 bg-slate-50 rounded-xl p-2 min-w-[190px]">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 block">
                Nº UNIFICADO DO PEDIDO
              </span>
              <span className="text-xl font-black text-slate-950 tracking-tight block font-mono">
                {orderNumberInfo.badgeNumber}
              </span>
              <div className="mt-0.5 pt-0.5 border-t border-slate-300 flex justify-between text-[8px]">
                <span className="text-slate-500 font-bold">Ref: {orderNumberInfo.reference}</span>
                <span className="font-black text-slate-900">{seller?.name || "Balcão / Loja"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BLOCO 1: DADOS DO CLIENTE & ENTREGA */}
        <section className="mb-2 border border-slate-300 rounded-xl p-2 bg-slate-50/60">
          <div className="text-[8px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
            <span>1. IDENTIFICAÇÃO DO CLIENTE & AGENDAMENTO</span>
            <span>DATA DA COMPRA: {formatDate(sale.saleDate || order.createdAt)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[8.5px]">
            <div>
              <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Nome Completo</span>
              <span className="font-black text-slate-950 uppercase">{customer?.fullName || "Não informado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Documento (CPF / CNPJ)</span>
              <span className="font-bold text-slate-800">{customer?.document || "Não cadastrado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[7.5px] uppercase">Telefone / WhatsApp</span>
              <span className="font-bold text-slate-800">{customer?.phone || customer?.whatsapp || "Não cadastrado"}</span>
            </div>

            {mainAddress && (
              <div className="md:col-span-2 pt-0.5 border-t border-slate-200">
                <span className="font-bold text-slate-500 text-[7.5px] uppercase block">Endereço de Entrega</span>
                <span className="font-bold text-slate-900">
                  {mainAddress.street}, {mainAddress.number}
                  {mainAddress.complement ? ` (${mainAddress.complement})` : ""}
                  {mainAddress.neighborhood ? ` • Bairro: ${mainAddress.neighborhood}` : ""}
                  {mainAddress.city ? ` • Cidade: ${mainAddress.city}/${mainAddress.state}` : ""}
                  {mainAddress.zipCode ? ` • CEP: ${mainAddress.zipCode}` : ""}
                </span>
              </div>
            )}

            <div className="pt-0.5 border-t border-slate-200">
              <span className="font-bold text-slate-500 text-[7.5px] uppercase block">Previsão de Entrega</span>
              <span className="font-black text-emerald-900">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "A combinar"}
                {order.deliveryDate && ` (${formatTimeOnly(order.deliveryDate) || "Comercial"})`}
              </span>
            </div>
          </div>
        </section>

        {/* BLOCO 2: COMPROVANTE DE TUDO QUE FOI FEITO & DISCRIMINAÇÃO COMERCIAL */}
        <section className="mb-2 border border-slate-300 rounded-xl overflow-hidden">
          <div className="bg-slate-950 text-white px-2.5 py-0.5 flex items-center justify-between text-[8.5px] font-black uppercase tracking-wider">
            <span>2. COMPROVANTE DE PRODUTOS, SERVIÇOS & ESPECIFICAÇÕES</span>
            <span>TOTAL ITENS: {items.length}</span>
          </div>

          <table className="w-full text-left text-[8px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[7.5px] uppercase font-black">
                <th className="py-1 px-2">Item</th>
                <th className="py-1 px-1.5">Descrição do Produto & Escolhas Contratadas</th>
                <th className="py-1 px-1.5 text-center">Qtd</th>
                <th className="py-1 px-1.5 text-right">Unitário</th>
                <th className="py-1 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item: any, idx: number) => {
                const specs = extractTechnicalSpecs(item);
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-1 px-2 font-black text-slate-900 w-7">#{idx + 1}</td>
                    <td className="py-1 px-1.5">
                      <p className="font-black text-slate-950 uppercase">{item.description}</p>
                      <p className="text-[7.5px] text-slate-600">
                        {specs.actualW > 0 ? `Medidas: ${specs.actualW}x${specs.actualL}x${specs.actualH}cm • ` : ""}
                        {specs.topFabricName ? `Tampo: ${specs.topFabricName} • ` : ""}
                        {specs.sideFabricName ? `Lateral: ${specs.sideFabricName} • ` : ""}
                        {specs.density ? `Densidade: ${specs.density} • ` : ""}
                        {specs.foamService && specs.foamService !== "NENHUM" ? `Pillow: ${specs.foamService} • ` : ""}
                        {specs.boxType ? `Box: ${specs.boxType}` : ""}
                      </p>
                      {specs.technicalNotes && (
                        <p className="text-[7px] text-amber-900 font-medium mt-0.5">
                          Obs: {specs.technicalNotes}
                        </p>
                      )}
                    </td>
                    <td className="py-1 px-1.5 text-center font-black text-slate-900">{item.quantity}</td>
                    <td className="py-1 px-1.5 text-right font-medium text-slate-700">{formatBRL(item.unitPrice)}</td>
                    <td className="py-1 px-2 text-right font-black text-slate-950">{formatBRL(item.totalAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TOTALIZADORES E CONDIÇÕES DE PAGAMENTO */}
          <div className="bg-slate-50 border-t border-slate-300 p-1.5 flex flex-wrap items-center justify-between gap-2 text-[8px]">
            <div className="space-y-0.5">
              <span className="font-black text-slate-600 uppercase text-[7px] block">Condição Financeira:</span>
              <p className="font-black text-slate-900">
                Status: {sale.financialStatus === "PAID" ? "PAGO ANTECIPADO" : "A RECEBER NA ENTREGA"}
              </p>
              {installments.length > 0 && (
                <div className="flex flex-wrap gap-1 text-[7.5px] text-slate-800 mt-0.5">
                  {installments.map((inst: any) => (
                    <span key={inst.id} className="bg-white px-1 py-0.5 rounded border border-slate-200 font-bold">
                      {inst.installmentNumber}x {inst.paymentMethod?.name || "Pagamento"} ({formatBRL(inst.amount)}) • Venc:{" "}
                      {formatDate(inst.dueDate)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right border-l border-slate-300 pl-3 space-y-0.5">
              <div className="text-[8px] text-slate-600 font-bold space-x-2">
                <span>Subtotal: {formatBRL(sale.subtotalAmount)}</span>
                {sale.discountAmount > 0 && (
                  <span className="text-emerald-700">Desc: -{formatBRL(sale.discountAmount)}</span>
                )}
                {sale.surchargeAmount > 0 && <span>Acrésc: +{formatBRL(sale.surchargeAmount)}</span>}
              </div>
              <p className="text-sm font-black text-slate-950 font-mono">
                TOTAL DO PEDIDO: {formatBRL(sale.totalAmount)}
              </p>
            </div>
          </div>
        </section>
        </div>

        {/* PARTE INFERIOR: TERMO DE GARANTIA E PROTOCOLO DE RECEBIMENTO */}
        <div className="mt-1 pt-0.5">
          {/* BLOCO 3: CERTIFICADO & TERMO DE GARANTIA INTEGRADO */}
          <section className="mb-1 border border-slate-900 rounded-xl p-1.5 bg-white">
            <div className="text-[8px] font-black uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-0.5 mb-1 flex justify-between">
              <span>3. CERTIFICADO DE GARANTIA & MANUAL DE CUIDADOS (SPA DO COLCHÃO)</span>
              <span className="text-slate-600">NORMA TÉCNICA ABNT NBR 15413</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[7.5px] text-slate-700 leading-snug">
              {/* COLUNA 1: PRAZOS */}
              <div className="border-r border-slate-200 pr-1.5 space-y-0.5">
                <p className="font-black text-slate-950 uppercase text-[8px] mb-0.5">
                  1. PRAZOS E COBERTURA
                </p>
                <p>
                  • <strong>Molas e Estrutura:</strong> 1 (um) ano de garantia contra quebras ou defeitos de fabricação na madeira ou molas.
                </p>
                <p>
                  • <strong>Espumas e Sustentação:</strong> 1 (um) ano. Conforme a norma <strong>ABNT NBR 15413</strong>, acomodação natural de até 10% nas áreas de maior peso corporal é processo normal de assentamento das fibras e não é defeito.
                </p>
                <p>
                  • <strong>Tecidos e Costuras:</strong> 90 dias legais contra desfiamento espontâneo de costuras.
                </p>
              </div>

              {/* COLUNA 2: CUIDADOS */}
              <div className="border-r border-slate-200 pr-1.5 space-y-0.5">
                <p className="font-black text-slate-950 uppercase text-[8px] mb-0.5">
                  2. MANUAL DE CONSERVAÇÃO
                </p>
                <p>
                  • <strong>Giro Obrigatório:</strong> Nos primeiros 3 meses, gire o colchão (cabeça/pés) a cada 15 dias. Após esse período, gire mensalmente.
                </p>
                <p>
                  • <strong>Base de Apoio:</strong> Apoiar sobre base plana e nivelada, sem vãos livres maiores que 6 cm.
                </p>
                <p>
                  • <strong>Proteção:</strong> Obrigatório o uso de protetor impermeável de colchão. Não molhar e manter o quarto ventilado.
                </p>
              </div>

              {/* COLUNA 3: EXCLUSÕES */}
              <div className="space-y-0.5">
                <p className="font-black text-slate-950 uppercase text-[8px] mb-0.5">
                  3. EXCLUSÕES DA GARANTIA
                </p>
                <p>• Danos por umidade, mofo, derramamento de líquidos, urina ou produtos abrasivos.</p>
                <p>• Deformações decorrentes de estrado inadequado ou peso superior ao limite nominal da densidade.</p>
                <p>• Rasgos, furos por objetos pontiagudos ou fios puxados por animais domésticos.</p>
                <p>• Remoção ou violação da etiqueta de identificação da fábrica.</p>
              </div>
            </div>
          </section>

          {/* BLOCO 4: PROTOCOLO INTEGRAL DE RECEBIMENTO & ASSINATURA DO CLIENTE */}
          <footer className="border-t border-slate-950 pt-1">
            <div className="flex items-center justify-between text-[7.5px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
              <span>4. PROTOCOLO DE RECEBIMENTO & ASSINATURA DO CLIENTE</span>
              <span className="font-mono text-slate-900">{orderNumberInfo.badgeNumber}</span>
            </div>

            <p className="text-[7.5px] text-slate-600 mb-1 leading-tight">
              Declaro ter recebido os produtos descritos no <strong>{orderNumberInfo.badgeNumber}</strong> em perfeitas
              condições de acabamento, medidas e funcionamento, conferi as especificações contratadas e confirmo ciência
              dos Termos de Garantia e Cuidados estipulados acima.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end pt-0.5">
              <div className="border-b border-slate-900 pb-0.5">
                <span className="text-[6.5px] text-slate-500 uppercase block">Nome do Recebedor:</span>
                <span className="text-[8px] font-black uppercase text-slate-900 truncate block">
                  {order.recipientName || customer?.fullName || "___________________________"}
                </span>
              </div>
              <div className="border-b border-slate-900 pb-0.5">
                <span className="text-[6.5px] text-slate-500 uppercase block">Documento (CPF / RG):</span>
                <span className="text-[8px] font-bold text-slate-900">
                  {customer?.document || "___________________________"}
                </span>
              </div>
              <div className="border-b border-slate-900 pb-0.5 text-center">
                <span className="text-[6.5px] text-slate-500 uppercase block">Data e Horário:</span>
                <span className="text-[8px] font-bold text-slate-900">____ / ____ / 2026 às ____:____</span>
              </div>
              <div className="border-b border-slate-900 pb-0.5 text-center">
                <span className="text-[6.5px] text-slate-500 uppercase block">Assinatura do Recebedor:</span>
                <span className="text-[7px] text-slate-400">Assinatura</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  };

  // =======================================================================
  // RENDERIZAÇÃO TÉRMICA 80MM (CUPOM COMPACTO)
  // =======================================================================
  const renderThermalSlip = () => {
    return (
      <div className="w-[80mm] max-w-[80mm] bg-white text-slate-900 font-sans mx-auto p-2 text-[10px] leading-tight">
        <div className="text-center border-b-2 border-slate-900 pb-2 mb-2">
          <span className="text-[8px] font-black uppercase text-slate-500 block">SPA DO COLCHÃO</span>
          <h1 className="text-lg font-black uppercase text-slate-950">{orderNumberInfo.badgeNumber}</h1>
          <p className="text-[8px] font-bold text-slate-600 uppercase">Comprovante de Pedido & Garantia</p>
          <p className="text-[8px] text-slate-400">
            Ref: {orderNumberInfo.reference} • {formatDateTime(sale.saleDate || order.createdAt)}
          </p>
        </div>

        {/* LOGÍSTICA AGENDADA */}
        <div className="mb-2 p-1.5 rounded bg-slate-100 border border-slate-300 space-y-1">
          {order.pickupDate && (
            <p className="font-bold text-amber-950">
              📦 Retirada: <span className="font-black">{formatDate(order.pickupDate)}</span>
            </p>
          )}
          {order.deliveryDate && (
            <p className="font-bold text-emerald-950">
              🚚 Entrega: <span className="font-black">{formatDate(order.deliveryDate)}</span>
            </p>
          )}
          {order.notes && <p className="text-[8px] text-slate-600">Obs: {order.notes}</p>}
        </div>

        {/* CLIENTE */}
        <div className="mb-2 text-[9px] border-b border-slate-200 pb-1">
          <p className="font-black uppercase">{customer?.fullName}</p>
          {customer?.phone && <p className="text-slate-600">Tel: {customer.phone}</p>}
          {mainAddress && (
            <p className="text-slate-600 text-[8px] leading-none mt-0.5">
              {mainAddress.street}, {mainAddress.number} - {mainAddress.neighborhood}
            </p>
          )}
        </div>

        {/* ITENS */}
        <div className="mb-2 border-b border-slate-200 pb-2 space-y-1.5">
          <p className="text-[8px] font-black uppercase text-slate-500">Itens e Especificações:</p>
          {items.map((item: any, idx: number) => {
            const specs = extractTechnicalSpecs(item);
            return (
              <div key={idx} className="text-[9px]">
                <div className="flex justify-between font-black">
                  <span>
                    {item.quantity}x {item.description}
                  </span>
                  <span>{formatBRL(item.totalAmount)}</span>
                </div>
                {specs.actualW > 0 && (
                  <p className="text-[8px] font-bold text-slate-700">
                    Medidas: {specs.actualW}x{specs.actualL}x{specs.actualH}cm
                  </p>
                )}
                {specs.topFabricName && (
                  <p className="text-[8px] text-slate-600">
                    Tecido: {specs.topFabricName} / {specs.sideFabricName || "Padrão"}
                  </p>
                )}
                {specs.technicalNotes && (
                  <p className="text-[8px] text-slate-600 bg-slate-50 p-1 rounded mt-0.5 leading-tight">
                    {specs.technicalNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* TOTAL */}
        <div className="mb-2 flex justify-between font-black text-sm border-b-2 border-slate-900 pb-1">
          <span>TOTAL:</span>
          <span>{formatBRL(sale.totalAmount)}</span>
        </div>

        {/* TERMO DE GARANTIA RESUMIDO */}
        <div className="mb-2 p-1.5 rounded bg-slate-50 border border-slate-200 text-[8px] text-slate-600 leading-tight">
          <p className="font-black text-slate-900 uppercase">Garantia Spa do Colchão:</p>
          <p>• 1 ano para estrutura de molas e madeiramento.</p>
          <p>• 1 ano para espumas (conforme ABNT NBR 15413, assentamento de até 10% é natural).</p>
          <p>• 90 dias para costuras e tecidos. Giro quinzenal nos primeiros 3 meses.</p>
        </div>

        {/* ASSINATURA */}
        <div className="pt-2 text-center text-[8px] text-slate-500">
          <p className="mb-2">Recebi os produtos em perfeitas condições e concordo com os termos.</p>
          <div className="border-t border-slate-900 pt-1">
            <p className="font-bold text-slate-800 uppercase">{customer?.fullName || "Assinatura do Cliente"}</p>
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
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-white px-3.5 py-1 rounded-full shadow-sm">
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
