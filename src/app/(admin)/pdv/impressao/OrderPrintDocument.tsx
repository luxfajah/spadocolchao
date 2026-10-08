"use client";

import React from "react";

export interface OrderPrintDocumentProps {
  order: any;
  format?: "a4" | "thermal";
  guiaMode?: "all" | "production" | "customer" | "warranty" | "prod_and_client" | "client_and_warranty" | "both";
  copies?: 1 | 2 | 3;
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
 * Extrai o número simplificado e unificado do pedido para todas as guias.
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

  // Mapeamento de visibilidade das 3 guias independentes
  // "both" é tratado como "prod_and_client" (ou all se configurado)
  const showGuiaProducao =
    guiaMode === "all" ||
    guiaMode === "production" ||
    guiaMode === "both" ||
    guiaMode === "prod_and_client";

  const showGuiaCliente =
    guiaMode === "all" ||
    guiaMode === "customer" ||
    guiaMode === "both" ||
    guiaMode === "prod_and_client" ||
    guiaMode === "client_and_warranty";

  const showGuiaGarantia =
    guiaMode === "all" ||
    guiaMode === "warranty" ||
    guiaMode === "client_and_warranty";

  // =======================================================================
  // FOLHA 1: ORDEM DE PRODUÇÃO (CHÃO DE FÁBRICA)
  // Sem valores financeiros, preços ou condições de pagamento.
  // =======================================================================
  const renderGuiaProducaoA4 = () => {
    return (
      <div className="w-full max-w-[210mm] bg-white text-slate-900 font-sans mx-auto p-6 shadow-sm border border-slate-300 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 text-[10px] leading-tight">
        {/* CABEÇALHO DA PRODUÇÃO */}
        <header className="border-b-2 border-slate-950 pb-2.5 mb-2.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-slate-950 text-white px-2 py-0.5 rounded">
                  GUIA DE PRODUÇÃO & CHÃO DE FÁBRICA
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Emissão: {formatDateTime(sale.saleDate || order.createdAt)}
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase mt-1">
                {companyInfo.name}
              </h1>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                FICHA TÉCNICA DE FABRICAÇÃO & ROTEIRO OPERACIONAL
              </p>
              <p className="text-[8.5px] text-slate-500 mt-0.5">
                CNPJ: {companyInfo.cnpj} • Fábrica e Produção Sob Medida
              </p>
            </div>

            {/* BOX NÚMERO UNIFICADO DO PEDIDO */}
            <div className="text-right border-2 border-slate-950 bg-slate-50 rounded-xl p-2 min-w-[200px]">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-500 block">
                Nº UNIFICADO DO PEDIDO
              </span>
              <span className="text-2xl font-black text-slate-950 tracking-tight block font-mono">
                {orderNumberInfo.badgeNumber}
              </span>
              <div className="mt-1 pt-1 border-t border-slate-300 flex justify-between text-[8.5px]">
                <span className="text-slate-500 font-bold">Ref: {orderNumberInfo.reference}</span>
                <span className="font-black text-slate-900">{seller?.name || "Balcão / Loja"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BLOCO 1: CRONOGRAMA DE PRODUÇÃO & LOGÍSTICA AGENDADA */}
        <section className="mb-2.5 border-2 border-slate-950 rounded-xl overflow-hidden">
          <div className="bg-slate-950 text-white px-3 py-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span>1. CRONOGRAMA DE PRODUÇÃO & LOGÍSTICA AGENDADA</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[8px]">
              Status: {order.currentStatus === "SOLD" ? "Vendido / Em Produção" : order.currentStatus}
            </span>
          </div>

          <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-slate-50/70">
            {/* RETIRADA */}
            <div
              className={`p-2 rounded-lg border ${
                order.pickupDate ? "bg-amber-50/90 border-amber-300" : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black uppercase text-amber-950">📦 RETIRADA AGENDADA (COLETA)</span>
                <span className="text-[8px] font-bold text-amber-800">
                  {order.pickupDate ? "Coleta no Cliente" : "Não aplicável"}
                </span>
              </div>
              <p className="text-base font-black text-amber-950">
                {order.pickupDate ? formatDate(order.pickupDate) : "Sem coleta agendada"}
              </p>
              {order.pickupDate && (
                <p className="text-[8.5px] font-bold text-amber-900 mt-0.5">
                  Horário: {formatTimeOnly(order.pickupDate) || "Comercial"}
                </p>
              )}
            </div>

            {/* ENTREGA */}
            <div
              className={`p-2 rounded-lg border ${
                order.deliveryDate ? "bg-emerald-50/90 border-emerald-300" : "bg-white border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black uppercase text-emerald-950">
                  🚚 DATA LIMITE DE ENTREGA (EXPEDIÇÃO FÁBRICA)
                </span>
                <span className="text-[8px] font-bold text-emerald-800">
                  {order.deliveryDate ? "Prazo Fatal Produção" : "A Definir"}
                </span>
              </div>
              <p className="text-base font-black text-emerald-950">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "Sem data agendada"}
              </p>
              {order.deliveryDate && (
                <p className="text-[8.5px] font-bold text-emerald-900 mt-0.5">
                  Horário / Turno: {formatTimeOnly(order.deliveryDate) || "Comercial"}
                </p>
              )}
            </div>

            {/* IDENTIFICAÇÃO BÁSICA PARA EXPEDIÇÃO */}
            <div className="md:col-span-2 pt-1 border-t border-slate-200 text-[9.5px] space-y-1">
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
                <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-800">
                  <span className="font-black text-slate-950 uppercase text-[8.5px] block">
                    Observações de Logística / Rota da Fábrica:
                  </span>
                  <span className="font-medium">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOCO 2: ESPECIFICAÇÕES TÉCNICAS DOS PRODUTOS (CHÃO DE FÁBRICA) */}
        <section className="mb-2.5 border-2 border-slate-950 rounded-xl overflow-hidden">
          <div className="bg-slate-950 text-white px-3 py-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span>2. ESPECIFICAÇÕES TÉCNICAS DE FABRICAÇÃO / REFORMA (CHÃO DE FÁBRICA)</span>
            <span>TOTAL DE ITENS: {items.length}</span>
          </div>

          <div className="divide-y-2 divide-slate-300">
            {items.map((item: any, idx: number) => {
              const specs = extractTechnicalSpecs(item);

              return (
                <div key={item.id || idx} className="p-2.5 bg-white space-y-2">
                  {/* Cabeçalho do Item */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-950 text-white text-[10px] font-black px-2 py-0.5 rounded">
                        ITEM #{idx + 1}
                      </span>
                      <h3 className="text-xs font-black text-slate-950 uppercase tracking-tight">
                        {item.description}
                      </h3>
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase">
                        ({item.productService?.type || item.type || "Fabricação Própria"})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="bg-slate-950 text-white font-black text-xs px-2.5 py-0.5 rounded-lg inline-block">
                        QTD: {item.quantity} UN
                      </span>
                    </div>
                  </div>

                  {/* GRID TÉCNICA DO CHÃO DE FÁBRICA */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-[9.5px]">
                    {/* MEDIDAS DE CORTE (4 COLUNAS) */}
                    <div className="md:col-span-4 bg-slate-100 p-2 rounded-lg border border-slate-300">
                      <span className="font-black text-[8.5px] uppercase tracking-wider text-slate-700 block mb-1">
                        📏 MEDIDAS DE CORTE & ESTRUTURA
                      </span>
                      {specs.actualW > 0 || specs.actualL > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-base font-black text-slate-950 font-mono tracking-tight">
                            {specs.actualW} x {specs.actualL} {specs.actualH > 0 ? `x ${specs.actualH}` : ""} cm
                          </p>
                          <p className="text-[8.5px] font-bold text-slate-600">
                            Largura: {specs.actualW}cm • Comprimento: {specs.actualL}cm{" "}
                            {specs.actualH > 0 ? `• Altura: ${specs.actualH}cm` : ""}
                          </p>
                          {specs.commercialSize && (
                            <p className="text-[8.5px] font-black text-blue-900 uppercase mt-0.5">
                              Padrão: {specs.commercialSize}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="font-bold text-slate-700">Dimensões padrão de catálogo</p>
                      )}
                    </div>

                    {/* REVESTIMENTOS ESCOLHIDOS (8 COLUNAS) */}
                    <div className="md:col-span-8 bg-blue-50/70 p-2 rounded-lg border border-blue-200">
                      <span className="font-black text-[8.5px] uppercase tracking-wider text-blue-950 block mb-1">
                        🧵 REVESTIMENTOS ESCOLHIDOS NO PDV
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {/* Tampo */}
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">Tecido Tampo</span>
                          <span className="font-black text-slate-900">
                            {specs.topFabricName || specs.topColor || "Padrão da Linha"}
                          </span>
                        </div>
                        {/* Faixa Lateral */}
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">Faixa Lateral</span>
                          <span className="font-black text-slate-900">
                            {specs.sideFabricName || specs.sideColor || "Padrão da Linha"}
                          </span>
                        </div>
                        {/* Densidade / Núcleo */}
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">Densidade / Núcleo</span>
                          <span className="font-black text-slate-900">
                            {specs.density || specs.mattressType || "Conforme ficha"}
                          </span>
                        </div>
                        {/* Tecido Inferior */}
                        {specs.bottomFabricName && (
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Tecido Inferior</span>
                            <span className="font-black text-slate-900">{specs.bottomFabricName}</span>
                          </div>
                        )}
                        {/* Fitilho / Debrum */}
                        {specs.tapeName && (
                          <div>
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Fitilho / Debrum</span>
                            <span className="font-black text-slate-900">{specs.tapeName}</span>
                          </div>
                        )}
                        {/* Camada Extra / Pillow */}
                        {specs.foamService && specs.foamService !== "NENHUM" && (
                          <div className="sm:col-span-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Pillow / Conforto</span>
                            <span className="font-black text-emerald-950">
                              ✦ {specs.foamService} {specs.addedFoamHeight ? `(+${specs.addedFoamHeight} cm)` : ""}
                            </span>
                          </div>
                        )}
                        {/* Box / Pés */}
                        {(specs.boxType || specs.feetName) && (
                          <div className="sm:col-span-3 pt-0.5 border-t border-blue-200/80">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Box & Pés</span>
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
                    <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-2 text-[9.5px] text-amber-950">
                      <span className="font-black uppercase tracking-wider text-[8px] text-amber-900 block mb-0.5">
                        📝 NOTAS TÉCNICAS & ESCOLHAS PERSONALIZADAS DO CLIENTE NO PDV:
                      </span>
                      <p className="font-medium whitespace-pre-wrap">{specs.technicalNotes}</p>
                    </div>
                  )}

                  {/* HIGIENIZAÇÃO */}
                  {specs.cleaningRows.length > 0 && (
                    <div className="bg-teal-50/70 border border-teal-300 rounded-lg p-2 text-[8.5px] text-teal-950">
                      <span className="font-black uppercase tracking-wider text-[8px] text-teal-900 block mb-1">
                        🧼 ESPECIFICAÇÃO DE HIGIENIZAÇÃO / IMPERMEABILIZAÇÃO:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {specs.cleaningRows.map((row: any, rIdx: number) => (
                          <div key={row.id || rIdx} className="bg-white p-1 rounded border border-teal-200">
                            <span className="font-black text-teal-900">
                              {row.quantity}x {row.objectType}
                            </span>
                            {row.observation && <p className="text-[7.5px] text-slate-500">{row.observation}</p>}
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

        {/* BLOCO 3: ROTEIRO DE CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA) */}
        <section className="mb-2 border border-slate-400 rounded-xl p-2 bg-white">
          <div className="text-[8.5px] font-black uppercase tracking-wider text-slate-950 border-b border-slate-200 pb-1 mb-1.5 flex justify-between">
            <span>3. ROTEIRO DE FABRICAÇÃO & CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA)</span>
            <span>VISTO OBRIGATÓRIO DOS OPERADORES</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8.5px]">
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-800 block">[ ] 1. Marcenaria & Estrutura</span>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Resp: ___________________</p>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Data: ___/___/2026</p>
            </div>
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-800 block">[ ] 2. Corte de Espuma & Bloco</span>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Resp: ___________________</p>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Data: ___/___/2026</p>
            </div>
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-800 block">[ ] 3. Tapeçaria, Costura & Debrum</span>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Resp: ___________________</p>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Data: ___/___/2026</p>
            </div>
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-800 block">[ ] 4. Qualidade Final & Embalagem</span>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Resp: ___________________</p>
              <p className="text-[7.5px] text-slate-500 mt-0.5">Data: ___/___/2026</p>
            </div>
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="text-center pt-1 border-t border-slate-300 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
          DOCUMENTO INTERNO DE PRODUÇÃO • NÃO CONTÉM DADOS FINANCEIROS • {companyInfo.name}
        </footer>
      </div>
    );
  };

  // =======================================================================
  // FOLHA 2: VIA DO CLIENTE (COMPROVANTE DE PEDIDO & CANHOTO DE ENTREGA)
  // TOTALMENTE SEPARADA DO TERMO DE GARANTIA PARA NÃO MISTURAR
  // =======================================================================
  const renderGuiaClienteA4 = () => {
    return (
      <div className="w-full max-w-[210mm] bg-white text-slate-900 font-sans mx-auto p-6 shadow-sm border border-slate-300 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 text-[10px] leading-tight">
        {/* CABEÇALHO DA VIA DO CLIENTE */}
        <header className="border-b-2 border-slate-950 pb-2.5 mb-2.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-blue-900 text-white px-2 py-0.5 rounded">
                  VIA DO CLIENTE: COMPROVANTE DE PEDIDO
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Emissão: {formatDateTime(sale.saleDate || order.createdAt)}
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase mt-1">
                {companyInfo.name}
              </h1>
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                COMPROVANTE DE COMPRA, ESPECIFICAÇÕES & RECIBO DE ENTREGA
              </p>
              <p className="text-[8.5px] text-slate-500 mt-0.5">
                CNPJ: {companyInfo.cnpj} • Contato / SAC: {companyInfo.phone}
              </p>
            </div>

            {/* BOX NÚMERO UNIFICADO DO PEDIDO */}
            <div className="text-right border-2 border-slate-950 bg-slate-50 rounded-xl p-2 min-w-[200px]">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-500 block">
                Nº UNIFICADO DO PEDIDO
              </span>
              <span className="text-2xl font-black text-slate-950 tracking-tight block font-mono">
                {orderNumberInfo.badgeNumber}
              </span>
              <div className="mt-1 pt-1 border-t border-slate-300 flex justify-between text-[8.5px]">
                <span className="text-slate-500 font-bold">Ref: {orderNumberInfo.reference}</span>
                <span className="font-black text-slate-900">{seller?.name || "Balcão / Loja"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BLOCO 1: DADOS DO CLIENTE & ENTREGA */}
        <section className="mb-2.5 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50">
          <div className="text-[8.5px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5 flex justify-between">
            <span>1. IDENTIFICAÇÃO DO CLIENTE & DADOS DE ENTREGA</span>
            <span>DATA DA COMPRA: {formatDate(sale.saleDate || order.createdAt)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9.5px]">
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Nome Completo</span>
              <span className="font-black text-slate-950 uppercase">{customer?.fullName || "Não informado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Documento (CPF / CNPJ)</span>
              <span className="font-bold text-slate-800">{customer?.document || "Não cadastrado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Telefone / WhatsApp</span>
              <span className="font-bold text-slate-800">{customer?.phone || customer?.whatsapp || "Não cadastrado"}</span>
            </div>

            {mainAddress && (
              <div className="md:col-span-2 pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-500 text-[8px] uppercase block">Endereço de Entrega</span>
                <span className="font-bold text-slate-900">
                  {mainAddress.street}, {mainAddress.number}
                  {mainAddress.complement ? ` (${mainAddress.complement})` : ""}
                  {mainAddress.neighborhood ? ` • Bairro: ${mainAddress.neighborhood}` : ""}
                  {mainAddress.city ? ` • Cidade: ${mainAddress.city}/${mainAddress.state}` : ""}
                  {mainAddress.zipCode ? ` • CEP: ${mainAddress.zipCode}` : ""}
                </span>
              </div>
            )}

            <div className="pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-500 text-[8px] uppercase block">Previsão de Entrega</span>
              <span className="font-black text-emerald-900">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "A combinar"}
                {order.deliveryDate && ` (${formatTimeOnly(order.deliveryDate) || "Comercial"})`}
              </span>
            </div>
          </div>
        </section>

        {/* BLOCO 2: DISCRIMINAÇÃO COMERCIAL DOS PRODUTOS & VALORES */}
        <section className="mb-2.5 border border-slate-300 rounded-xl overflow-hidden">
          <div className="bg-slate-950 text-white px-3 py-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span>2. PRODUTOS / SERVIÇOS CONTRATADOS & DETALHAMENTO COMERCIAL</span>
            <span>TOTAL ITENS: {items.length}</span>
          </div>

          <table className="w-full text-left text-[9px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[8.5px] uppercase font-black">
                <th className="py-1 px-2.5">Item</th>
                <th className="py-1 px-2">Descrição & Especificações</th>
                <th className="py-1 px-2 text-center">Qtd</th>
                <th className="py-1 px-2 text-right">Unitário</th>
                <th className="py-1 px-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item: any, idx: number) => {
                const specs = extractTechnicalSpecs(item);
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-1 px-2.5 font-black text-slate-900 w-8">#{idx + 1}</td>
                    <td className="py-1 px-2">
                      <p className="font-black text-slate-950 uppercase">{item.description}</p>
                      <p className="text-[8px] text-slate-600 mt-0.5">
                        {specs.actualW > 0 ? `Medidas: ${specs.actualW}x${specs.actualL}x${specs.actualH}cm • ` : ""}
                        {specs.topFabricName ? `Tampo: ${specs.topFabricName} • ` : ""}
                        {specs.sideFabricName ? `Lateral: ${specs.sideFabricName} • ` : ""}
                        {specs.density ? `Densidade: ${specs.density}` : ""}
                      </p>
                    </td>
                    <td className="py-1 px-2 text-center font-black text-slate-900">{item.quantity}</td>
                    <td className="py-1 px-2 text-right font-medium text-slate-700">{formatBRL(item.unitPrice)}</td>
                    <td className="py-1 px-2.5 text-right font-black text-slate-950">{formatBRL(item.totalAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TOTALIZADORES E CONDIÇÕES DE PAGAMENTO */}
          <div className="bg-slate-50 border-t border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-[9px]">
              <span className="font-black text-slate-600 uppercase text-[8px] block">Condição de Pagamento:</span>
              <p className="font-black text-slate-900">
                Status: {sale.financialStatus === "PAID" ? "PAGO ANTECIPADO" : "A RECEBER NA ENTREGA"}
              </p>
              {installments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 text-[8.5px] text-slate-800 mt-0.5">
                  {installments.map((inst: any) => (
                    <span key={inst.id} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                      {inst.installmentNumber}x {inst.paymentMethod?.name || "Pagamento"} ({formatBRL(inst.amount)}) • Venc:{" "}
                      {formatDate(inst.dueDate)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right border-l border-slate-300 pl-4 space-y-0.5">
              <div className="text-[9px] text-slate-600 font-bold space-x-2">
                <span>Subtotal: {formatBRL(sale.subtotalAmount)}</span>
                {sale.discountAmount > 0 && (
                  <span className="text-emerald-700">Desconto: -{formatBRL(sale.discountAmount)}</span>
                )}
                {sale.surchargeAmount > 0 && <span>Acréscimo: +{formatBRL(sale.surchargeAmount)}</span>}
              </div>
              <p className="text-lg font-black text-slate-950 font-mono">
                TOTAL: {formatBRL(sale.totalAmount)}
              </p>
            </div>
          </div>
        </section>

        {/* NOTA SOBRE O CERTIFICADO DE GARANTIA SEPARADO */}
        <section className="mb-3 p-2 bg-blue-50/60 border border-blue-200 rounded-xl text-[8.5px] text-blue-950 flex items-center justify-between">
          <div>
            <span className="font-black uppercase tracking-wider block">
              🛡️ CERTIFICADO DE GARANTIA EMITIDO EM GUIA SEPARADA:
            </span>
            <span>
              O Termo de Garantia oficial e manual de conservação deste pedido é emitido em documento exclusivo. Guarde ambas as vias.
            </span>
          </div>
          <span className="font-mono font-black text-xs text-blue-900">{orderNumberInfo.badgeNumber}</span>
        </section>

        {/* BLOCO 3: CANHOTO DESTACÁVEL DE ENTREGA & RECEBIMENTO */}
        <footer className="border-t-2 border-dashed border-slate-900 pt-3">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">
            <span>✂ DESTACAR NO ATO DA ENTREGA (OBRIGATÓRIO DEVOLVER À EXPEDIÇÃO ASSINADO)</span>
            <span>PROTOCOLO DE ENTREGA DO CLIENTE</span>
          </div>

          <p className="text-[8.5px] text-slate-700 mb-3 leading-tight">
            Declaro ter recebido os produtos descritos no <strong>{orderNumberInfo.badgeNumber}</strong> em perfeitas
            condições de acabamento, higiene e funcionamento, conferi as medidas e tecidos solicitados.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end pt-1">
            <div className="border-b border-slate-900 pb-0.5">
              <span className="text-[7.5px] text-slate-500 uppercase block">Nome Legível do Recebedor:</span>
              <span className="text-[9px] font-black uppercase text-slate-900 truncate block">
                {order.recipientName || customer?.fullName || "___________________________"}
              </span>
            </div>
            <div className="border-b border-slate-900 pb-0.5">
              <span className="text-[7.5px] text-slate-500 uppercase block">Documento (CPF / RG):</span>
              <span className="text-[9px] font-bold text-slate-900">
                {customer?.document || "___________________________"}
              </span>
            </div>
            <div className="border-b border-slate-900 pb-0.5 text-center">
              <span className="text-[7.5px] text-slate-500 uppercase block">Data e Horário:</span>
              <span className="text-[9px] font-bold text-slate-900">____ / ____ / 2026 às ____:____</span>
            </div>
            <div className="border-b border-slate-900 pb-0.5 text-center">
              <span className="text-[7.5px] text-slate-500 uppercase block">Assinatura do Recebedor:</span>
              <span className="text-[8px] text-slate-400">Assinatura</span>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  // =======================================================================
  // FOLHA 3: CERTIFICADO & TERMO OFICIAL DE GARANTIA (SPA DO COLCHÃO)
  // TOTALMENTE SEPARADO EM UMA FOLHA EXCLUSIVA, ELEGANTE E CORPORATIVA
  // =======================================================================
  const renderTermoGarantiaA4 = () => {
    return (
      <div className="w-full max-w-[210mm] bg-white text-slate-900 font-sans mx-auto p-7 shadow-sm border border-slate-300 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 text-[10px] leading-relaxed">
        {/* CABEÇALHO DO CERTIFICADO DE GARANTIA */}
        <header className="border-b-2 border-slate-950 pb-3 mb-3 text-center relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8.5px] font-black uppercase tracking-widest bg-emerald-800 text-white px-2.5 py-0.5 rounded">
              DOCUMENTO OFICIAL DE GARANTIA
            </span>
            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
              Emissão: {formatDate(sale.saleDate || order.createdAt)}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase mt-1">
            {companyInfo.name}
          </h1>
          <p className="text-xs font-black text-slate-800 uppercase tracking-widest mt-0.5">
            CERTIFICADO DE GARANTIA & MANUAL DO PRODUTO
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            Em conformidade com a Norma Técnica ABNT NBR 15413 e Código de Defesa do Consumidor
          </p>

          {/* BOX DESTAQUE DO NÚMERO DO PEDIDO UNIFICADO */}
          <div className="mt-3 inline-flex items-center gap-4 px-4 py-1.5 rounded-xl border-2 border-slate-950 bg-slate-50">
            <div className="text-left">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                Nº UNIFICADO DO PEDIDO
              </span>
              <span className="text-xl font-black text-slate-950 font-mono">
                {orderNumberInfo.badgeNumber}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div className="text-left">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                Vendedor / Atendente
              </span>
              <span className="text-xs font-bold text-slate-800">
                {seller?.name || "Balcão / Loja"}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div className="text-left">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 block">
                Ref. Comercial
              </span>
              <span className="text-xs font-mono text-slate-600">
                {orderNumberInfo.reference}
              </span>
            </div>
          </div>
        </header>

        {/* IDENTIFICAÇÃO DO TITULAR DA GARANTIA */}
        <section className="mb-3 border border-slate-300 rounded-xl p-2.5 bg-slate-50/60">
          <div className="text-[8.5px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5 flex justify-between">
            <span>DADOS DO TITULAR DA GARANTIA</span>
            <span>INÍCIO DA VIGÊNCIA: {formatDate(order.deliveryDate || sale.saleDate || order.createdAt)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9.5px]">
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Titular</span>
              <span className="font-black text-slate-950 uppercase">{customer?.fullName || "Cliente"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Documento</span>
              <span className="font-bold text-slate-800">{customer?.document || "Não cadastrado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Telefone / SAC</span>
              <span className="font-bold text-slate-800">{customer?.phone || customer?.whatsapp || "---"}</span>
            </div>
          </div>
        </section>

        {/* PRODUTOS COBERTOS POR ESTE CERTIFICADO */}
        <section className="mb-3 border border-slate-300 rounded-xl p-2.5 bg-white">
          <div className="text-[8.5px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5 flex justify-between">
            <span>PRODUTOS COBERTOS NESTA GARANTIA</span>
            <span>QTD: {items.length} ITEM(NS)</span>
          </div>

          <div className="divide-y divide-slate-100 text-[9px]">
            {items.map((item: any, idx: number) => {
              const specs = extractTechnicalSpecs(item);
              return (
                <div key={idx} className="py-1 flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 uppercase">
                      {item.quantity}x {item.description}
                    </span>
                    <span className="text-slate-600 ml-2">
                      {specs.actualW > 0 ? `(${specs.actualW}x${specs.actualL}x${specs.actualH} cm)` : ""}
                      {specs.density ? ` • Densidade: ${specs.density}` : ""}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-800 text-[8.5px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Cobertura Ativa
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CORPO DO TERMO DE GARANTIA EM 3 BLOCOS ESPECÍFICOS */}
        <div className="space-y-3 text-[9px] text-slate-800 leading-snug">
          {/* BLOCO 1: PRAZOS E COBERTURA */}
          <div className="border-2 border-slate-950 rounded-xl p-3 bg-white">
            <h3 className="font-black text-slate-950 uppercase text-[9.5px] border-b border-slate-200 pb-1 mb-2">
              1. PRAZOS E COBERTURA DA GARANTIA CONTRATUAL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="font-black text-slate-900 uppercase text-[8.5px] mb-0.5">
                  🔩 Estrutura de Molas e Madeiramento: 1 (Um) Ano
                </p>
                <p className="text-[8.5px] text-slate-700">
                  Garantia contra quebra de travessas, trincas na madeira da base/box e rompimento ou deslocamento involuntário de molas pocket/ensacadas.
                </p>
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-[8.5px] mb-0.5">
                  🧽 Espumas de Sustentação: 1 (Um) Ano
                </p>
                <p className="text-[8.5px] text-slate-700">
                  Garantia contra deformação precoce. Conforme a <strong>Norma ABNT NBR 15413</strong>, o assentamento natural das fibras de até 10% da altura inicial nas áreas de maior peso corporal é característica normal de uso e não configura defeito.
                </p>
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-[8.5px] mb-0.5">
                  🧵 Tecidos, Costuras e Zíperes: 90 Dias
                </p>
                <p className="text-[8.5px] text-slate-700">
                  Garantia legal contra defeitos de confecção e desfiamento espontâneo de costuras de fechamento.
                </p>
              </div>
            </div>
          </div>

          {/* BLOCO 2: INSTRUÇÕES DE USO E CONSERVAÇÃO */}
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/70">
            <h3 className="font-black text-slate-950 uppercase text-[9.5px] border-b border-slate-200 pb-1 mb-2">
              2. INSTRUÇÕES DE USO, GIRO E CUIDADOS ESSENCIAIS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[8.5px]">
              <div>
                <p className="font-bold text-slate-900 uppercase text-[8.5px] mb-0.5">🔄 Ciclo de Giro</p>
                <p className="text-slate-700">
                  Nos primeiros 3 meses, efetue o giro horizontal (pés e cabeça) a cada 15 dias. A partir do 4º mês, gire uma vez ao mês para nivelamento simétrico das espumas.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-900 uppercase text-[8.5px] mb-0.5">🛏️ Apoio e Estrado</p>
                <p className="text-slate-700">
                  Apoie o colchão exclusivamente sobre base plana, firme e sem desníveis. Estrados de madeira não devem possuir vãos entre ripas maiores que 6 cm.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-900 uppercase text-[8.5px] mb-0.5">🛡️ Proteção Impermeável</p>
                <p className="text-slate-700">
                  É imprescindível o uso contínuo de capa protetora impermeável de colchão. Não molhe, não exponha ao sol forte e não passe ferro elétrico sobre o tecido.
                </p>
              </div>
            </div>
          </div>

          {/* BLOCO 3: EXCLUSÕES DA GARANTIA */}
          <div className="border border-slate-300 rounded-xl p-3 bg-white">
            <h3 className="font-black text-slate-950 uppercase text-[9.5px] border-b border-slate-200 pb-1 mb-2">
              3. HIPÓTESES DE EXCLUSÃO DA GARANTIA
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[8.5px] text-slate-700 list-disc list-inside">
              <li>Manchas causadas por derramamento de líquidos, urina, suor, mofo ou umidade excessiva.</li>
              <li>Deformações provocadas pelo uso de estrados empenados, quebrados ou inadequados.</li>
              <li>Sobrecarga de peso superior ao limite de densidade nominal do modelo contratado.</li>
              <li>Rasgos, perfurações por objetos pontiagudos ou fios puxados por animais de estimação.</li>
              <li>Danos ocorridos durante transporte ou manuseio por terceiros após a entrega.</li>
              <li>Ausência, rasura ou remoção da etiqueta de identificação e número de série da fábrica.</li>
            </ul>
          </div>
        </div>

        {/* ASSINATURA E VALIDAÇÃO DA FÁBRICA / LOJA */}
        <footer className="mt-4 pt-3 border-t-2 border-slate-950">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 items-end text-center">
            <div>
              <p className="text-[8px] text-slate-500 uppercase">Validade e Início:</p>
              <p className="text-[10px] font-black text-slate-900 mt-0.5">
                {formatDate(order.deliveryDate || sale.saleDate || order.createdAt)}
              </p>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1">
                <p className="text-[9px] font-bold uppercase text-slate-900">{companyInfo.name}</p>
                <p className="text-[7.5px] text-slate-500">Assinatura / Carimbo Autorizado</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-900 pt-1">
                <p className="text-[9px] font-bold uppercase text-slate-900">{customer?.fullName || "Cliente"}</p>
                <p className="text-[7.5px] text-slate-500">Assinatura do Titular</p>
              </div>
            </div>
          </div>

          <p className="text-center text-[7.5px] font-bold text-slate-400 uppercase tracking-widest mt-3">
            GUARDE ESTE CERTIFICADO JUNTO COM O COMPROVANTE DE PEDIDO • SPA DO COLCHÃO
          </p>
        </footer>
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
          <p className="text-[8px] font-bold text-slate-600 uppercase">Comprovante de Pedido</p>
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

        {/* CANHOTO */}
        <div className="pt-2 text-center text-[8px] text-slate-500">
          <p className="mb-3">Recebi os produtos em perfeitas condições.</p>
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
  // FORMATO A4 COM AS GUIAS INDEPENDENTES E ISOLADAS
  // =======================================================================
  return (
    <div className="order-print-container w-full space-y-8 print:space-y-0">
      {/* 1. GUIA DE PRODUÇÃO */}
      {showGuiaProducao && (
        <div className="guia-producao-page">
          {renderGuiaProducaoA4()}
        </div>
      )}

      {/* DIVISOR SE HOUVER PRODUÇÃO E CLIENTE */}
      {showGuiaProducao && showGuiaCliente && (
        <>
          <div className="no-print my-6 flex items-center justify-center gap-3 text-slate-400">
            <div className="h-px bg-slate-300 flex-1 max-w-[210mm]" />
            <span className="text-[10px] font-black uppercase tracking-widest bg-slate-200 px-3 py-1 rounded-full text-slate-700 shadow-sm">
              ✂ DIVISOR DE PÁGINA A4 • PRÓXIMA FOLHA: VIA DO CLIENTE
            </span>
            <div className="h-px bg-slate-300 flex-1 max-w-[210mm]" />
          </div>

          <div
            className="sheet-page-break print:break-before-page"
            style={{ pageBreakBefore: "always", breakBefore: "page" }}
          />
        </>
      )}

      {/* 2. VIA DO CLIENTE (SEM MISTURAR COM O TERMO DE GARANTIA) */}
      {showGuiaCliente && (
        <div className="guia-cliente-page">
          {renderGuiaClienteA4()}
        </div>
      )}

      {/* DIVISOR SE HOUVER GARANTIA */}
      {(showGuiaProducao || showGuiaCliente) && showGuiaGarantia && (
        <>
          <div className="no-print my-6 flex items-center justify-center gap-3 text-slate-400">
            <div className="h-px bg-slate-300 flex-1 max-w-[210mm]" />
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full shadow-sm">
              ✂ DIVISOR DE PÁGINA A4 • PRÓXIMA FOLHA: CERTIFICADO DE GARANTIA EXCLUSIVO
            </span>
            <div className="h-px bg-slate-300 flex-1 max-w-[210mm]" />
          </div>

          <div
            className="sheet-page-break print:break-before-page"
            style={{ pageBreakBefore: "always", breakBefore: "page" }}
          />
        </>
      )}

      {/* 3. TERMO DE GARANTIA (FOLHA DEDICADA E EXCLUSIVA) */}
      {showGuiaGarantia && (
        <div className="guia-garantia-page">
          {renderTermoGarantiaA4()}
        </div>
      )}
    </div>
  );
}
