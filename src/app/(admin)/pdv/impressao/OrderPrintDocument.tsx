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
        } w-full max-w-[210mm] min-h-[297mm] print:min-h-0 bg-white text-black font-sans mx-auto p-4 sm:p-5 border border-black rounded-none print:border-none print:p-0 print:m-0 text-[8.5px] leading-tight flex flex-col justify-between`}
      >
        <div className="flex-1 flex flex-col">
          {/* CABEÇALHO CORPORATIVO DA FÁBRICA */}
          <header className="border-b-2 border-black pb-2 mb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-none">
                    GUIA 1 DE 2: ORDEM DE PRODUÇÃO & CHÃO DE FÁBRICA
                  </span>
                  <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-wider">
                    EMISSÃO: {formatDateTime(sale.saleDate || order.createdAt)}
                  </span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-black uppercase">
                  {companyInfo.name}
                </h1>
                <p className="text-[9px] font-black text-neutral-800 uppercase tracking-wider">
                  FICHA TÉCNICA INDUSTRIAL & ROTEIRO OPERACIONAL DE FABRICAÇÃO
                </p>
                <p className="text-[8px] text-neutral-600 mt-0.5">
                  CNPJ: {companyInfo.cnpj} • Unidade Fabril & Manufatura Especializada
                </p>
              </div>

              {/* BOX RETANGULAR DO NÚMERO DO PEDIDO */}
              <div className="border-2 border-black bg-neutral-50 p-2 min-w-[200px] text-right rounded-none">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-neutral-500 block">
                  Nº UNIFICADO DO PEDIDO
                </span>
                <span className="text-2xl font-black text-black tracking-tight block font-mono">
                  {orderNumberInfo.badgeNumber}
                </span>
                <div className="mt-1 pt-1 border-t border-black/30 flex justify-between text-[8px]">
                  <span className="font-bold text-neutral-600">Ref: {orderNumberInfo.reference}</span>
                  <span className="font-black text-black uppercase">{seller?.name || "Balcão / Loja"}</span>
                </div>
              </div>
            </div>
          </header>

          {/* 1. CRONOGRAMA OPERACIONAL & LOGÍSTICA DE EXPEDIÇÃO */}
          <section className="mb-2 border border-black rounded-none">
            <div className="bg-black text-white px-2 py-1 flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
              <span>1. CRONOGRAMA OPERACIONAL & LOGÍSTICA DE EXPEDIÇÃO</span>
              <span className="bg-neutral-800 px-1.5 py-0.5 text-[7.5px]">
                STATUS: {order.currentStatus === "SOLD" ? "VENDIDO / EM PRODUÇÃO" : order.currentStatus}
              </span>
            </div>

            <div className="p-2 grid grid-cols-2 gap-2 text-[8.5px] bg-white">
              {/* RETIRADA */}
              <div className={`p-1.5 border ${order.pickupDate ? "border-black bg-neutral-50" : "border-neutral-200 bg-neutral-50 text-neutral-400"}`}>
                <div className="flex justify-between items-center text-[7.5px] font-black uppercase mb-0.5">
                  <span>RETIRADA AGENDADA (COLETA)</span>
                  <span>{order.pickupDate ? "COLETA NO CLIENTE" : "NÃO APLICÁVEL"}</span>
                </div>
                <p className="text-sm font-black font-mono text-black">
                  {order.pickupDate ? formatDate(order.pickupDate) : "---"}
                </p>
                {order.pickupDate && (
                  <p className="text-[7.5px] font-bold text-neutral-700 mt-0.5">
                    Horário: {formatTimeOnly(order.pickupDate) || "Horário Comercial"}
                  </p>
                )}
              </div>

              {/* ENTREGA */}
              <div className={`p-1.5 border ${order.deliveryDate ? "border-black bg-neutral-50" : "border-neutral-200 bg-neutral-50 text-neutral-400"}`}>
                <div className="flex justify-between items-center text-[7.5px] font-black uppercase mb-0.5">
                  <span>PRAZO LIMITE DE ENTREGA (EXPEDIÇÃO FÁBRICA)</span>
                  <span className="font-bold">{order.deliveryDate ? "EXPEDIÇÃO AGENDADA" : "A DEFINIR"}</span>
                </div>
                <p className="text-sm font-black font-mono text-black">
                  {order.deliveryDate ? formatDate(order.deliveryDate) : "A Combinar"}
                </p>
                {order.deliveryDate && (
                  <p className="text-[7.5px] font-bold text-neutral-700 mt-0.5">
                    Turno: {formatTimeOnly(order.deliveryDate) || "Comercial"}
                  </p>
                )}
              </div>

              {/* CLIENTE & ENDEREÇO DE ENTREGA */}
              <div className="col-span-2 pt-1 border-t border-neutral-300 text-[8.5px] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-neutral-500 uppercase text-[7.5px]">Destinatário: </span>
                  <span className="font-black text-black uppercase">
                    {order.recipientName || customer?.fullName || "Cliente"}
                  </span>
                  {customer?.phone && (
                    <span className="text-neutral-600 ml-2">
                      • Tel: <strong className="text-black font-mono">{customer.phone}</strong>
                    </span>
                  )}
                </div>
                {mainAddress && (
                  <div>
                    <span className="font-bold text-neutral-500 uppercase text-[7.5px]">Região de Entrega: </span>
                    <span className="font-black text-black uppercase">
                      {mainAddress.neighborhood} - {mainAddress.city}/{mainAddress.state}
                    </span>
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="col-span-2 bg-neutral-100 p-1.5 border border-neutral-300 text-[8px]">
                  <strong className="block text-black uppercase text-[7.5px]">Observações de Logística / Rota:</strong>
                  <span className="text-neutral-800 font-medium">{order.notes}</span>
                </div>
              )}
            </div>
          </section>

          {/* 2. ESPECIFICAÇÕES TÉCNICAS DE FABRICAÇÃO & MATERIAIS */}
          <section className="mb-2 border border-black rounded-none">
            <div className="bg-black text-white px-2 py-1 flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
              <span>2. ESPECIFICAÇÕES TÉCNICAS DE FABRICAÇÃO & MATERIAIS (CHÃO DE FÁBRICA)</span>
              <span>TOTAL DE ITENS: {items.length}</span>
            </div>

            <div className="divide-y divide-black/30">
              {items.map((item: any, idx: number) => {
                const specs = extractTechnicalSpecs(item);
                return (
                  <div key={item.id || idx} className="p-2 bg-white space-y-1.5">
                    {/* Barra do Item */}
                    <div className="flex items-center justify-between gap-2 border-b border-black/20 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-black text-white text-[8.5px] font-black px-1.5 py-0.5">
                          ITEM #{idx + 1}
                        </span>
                        <span className="text-xs font-black text-black uppercase">
                          {item.description}
                        </span>
                        <span className="text-[7.5px] font-bold text-neutral-500 uppercase">
                          [{item.productService?.type || item.type || "Fabricação Própria"}]
                        </span>
                      </div>
                      <span className="bg-black text-white font-black text-xs px-2.5 py-0.5 font-mono">
                        QTD: {item.quantity} UN
                      </span>
                    </div>

                    {/* Grade Técnica: Medidas de Corte + Revestimentos */}
                    <div className="grid grid-cols-12 gap-1.5 text-[8.5px]">
                      {/* Medidas de Corte */}
                      <div className="col-span-4 bg-neutral-50 p-1.5 border border-black/40">
                        <span className="font-black text-[7.5px] uppercase tracking-wider text-neutral-700 block mb-0.5">
                          📏 MEDIDAS DE CORTE & ESTRUTURA
                        </span>
                        {specs.actualW > 0 || specs.actualL > 0 ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-black text-black font-mono tracking-tight">
                              {specs.actualW} x {specs.actualL} {specs.actualH > 0 ? `x ${specs.actualH}` : ""} cm
                            </p>
                            <p className="text-[7.5px] font-bold text-neutral-600">
                              Largura: {specs.actualW}cm • Comprimento: {specs.actualL}cm {specs.actualH > 0 ? `• Altura: ${specs.actualH}cm` : ""}
                            </p>
                            {specs.commercialSize && (
                              <p className="text-[7.5px] font-black text-black uppercase border-t border-neutral-300 pt-0.5 mt-0.5">
                                Padrão: {specs.commercialSize}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="font-bold text-neutral-800">Dimensões padrão de linha</p>
                        )}
                      </div>

                      {/* Revestimentos e Matérias-Primas */}
                      <div className="col-span-8 bg-neutral-50 p-1.5 border border-black/40">
                        <span className="font-black text-[7.5px] uppercase tracking-wider text-neutral-700 block mb-0.5">
                          🧵 ESPECIFICAÇÃO DE MATERIAIS & REVESTIMENTOS
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <span className="text-[7px] font-bold text-neutral-500 uppercase block">Tecido Tampo:</span>
                            <span className="font-black text-black">{specs.topFabricName || specs.topColor || "Padrão"}</span>
                          </div>
                          <div>
                            <span className="text-[7px] font-bold text-neutral-500 uppercase block">Faixa Lateral:</span>
                            <span className="font-black text-black">{specs.sideFabricName || specs.sideColor || "Padrão"}</span>
                          </div>
                          <div>
                            <span className="text-[7px] font-bold text-neutral-500 uppercase block">Densidade / Núcleo:</span>
                            <span className="font-black text-black">{specs.density || specs.mattressType || "Conforme ficha"}</span>
                          </div>
                          {specs.bottomFabricName && (
                            <div>
                              <span className="text-[7px] font-bold text-neutral-500 uppercase block">Tecido Inferior:</span>
                              <span className="font-black text-black">{specs.bottomFabricName}</span>
                            </div>
                          )}
                          {specs.tapeName && (
                            <div>
                              <span className="text-[7px] font-bold text-neutral-500 uppercase block">Debrum / Fitilho:</span>
                              <span className="font-black text-black">{specs.tapeName}</span>
                            </div>
                          )}
                          {specs.foamService && specs.foamService !== "NENHUM" && (
                            <div className="col-span-2">
                              <span className="text-[7px] font-bold text-neutral-500 uppercase block">Camada Pillow / Conforto:</span>
                              <span className="font-black text-black">✦ {specs.foamService} {specs.addedFoamHeight ? `(+${specs.addedFoamHeight} cm)` : ""}</span>
                            </div>
                          )}
                          {(specs.boxType || specs.feetName) && (
                            <div className="col-span-3 pt-0.5 border-t border-neutral-300">
                              <span className="text-[7px] font-bold text-neutral-500 uppercase block">Estrutura Box & Pés:</span>
                              <span className="font-black text-black">
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

                    {/* Notas Técnicas do PDV */}
                    {specs.technicalNotes && (
                      <div className="bg-neutral-100 border border-black/30 p-1.5 text-[8.5px]">
                        <span className="font-black uppercase tracking-wider text-[7.5px] text-black block mb-0.5">
                          📝 NOTAS TÉCNICAS E ESCOLHAS DIGITADAS NO PDV:
                        </span>
                        <p className="font-medium text-black whitespace-pre-wrap">{specs.technicalNotes}</p>
                      </div>
                    )}

                    {/* Higienização */}
                    {specs.cleaningRows.length > 0 && (
                      <div className="bg-neutral-100 border border-black/30 p-1.5 text-[8px]">
                        <span className="font-black uppercase tracking-wider text-[7.5px] text-black block mb-0.5">
                          🧼 SERVIÇO DE HIGIENIZAÇÃO / IMPERMEABILIZAÇÃO:
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {specs.cleaningRows.map((row: any, rIdx: number) => (
                            <div key={row.id || rIdx} className="border border-neutral-300 p-1 bg-white">
                              <span className="font-black text-black">{row.quantity}x {row.objectType}</span>
                              {row.observation && <p className="text-[7px] text-neutral-600">{row.observation}</p>}
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
          {/* 3. ROTEIRO DE CONTROLE DE QUALIDADE */}
          <section className="mb-1 border border-black rounded-none bg-white">
            <div className="bg-black text-white px-2 py-0.5 text-[7.5px] font-black uppercase tracking-wider flex justify-between">
              <span>3. ROTEIRO DE FABRICAÇÃO & CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA)</span>
              <span>VISTO OBRIGATÓRIO DOS OPERADORES</span>
            </div>

            <div className="grid grid-cols-4 divide-x divide-black text-[7.5px]">
              <div className="p-1">
                <span className="font-black text-black block">[ ] 1. Marcenaria & Box</span>
                <p className="text-[7px] text-neutral-600 mt-1">Resp: ___________________</p>
                <p className="text-[7px] text-neutral-600">Data: ___/___/2026</p>
              </div>
              <div className="p-1">
                <span className="font-black text-black block">[ ] 2. Corte de Espuma</span>
                <p className="text-[7px] text-neutral-600 mt-1">Resp: ___________________</p>
                <p className="text-[7px] text-neutral-600">Data: ___/___/2026</p>
              </div>
              <div className="p-1">
                <span className="font-black text-black block">[ ] 3. Tapeçaria & Costura</span>
                <p className="text-[7px] text-neutral-600 mt-1">Resp: ___________________</p>
                <p className="text-[7px] text-neutral-600">Data: ___/___/2026</p>
              </div>
              <div className="p-1">
                <span className="font-black text-black block">[ ] 4. Qualidade & Embalagem</span>
                <p className="text-[7px] text-neutral-600 mt-1">Resp: ___________________</p>
                <p className="text-[7px] text-neutral-600">Data: ___/___/2026</p>
              </div>
            </div>
          </section>

          {/* RODAPÉ */}
          <footer className="text-center pt-0.5 border-t border-black text-[7px] font-bold text-neutral-600 uppercase tracking-wider">
            DOCUMENTO INTERNO DE PRODUÇÃO • USO EXCLUSIVO DO CHÃO DE FÁBRICA • NÃO CONTÉM DADOS FINANCEIROS • {companyInfo.name}
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
        className="guia-page guia-page-2 w-full max-w-[210mm] min-h-[297mm] print:min-h-0 bg-white text-black font-sans mx-auto p-4 sm:p-5 border border-black rounded-none print:border-none print:p-0 print:m-0 text-[8.5px] leading-tight flex flex-col justify-between"
      >
        <div className="flex-1 flex flex-col">
          {/* CABEÇALHO CORPORATIVO DO PEDIDO */}
          <header className="border-b-2 border-black pb-2 mb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-none">
                    GUIA 2 DE 2: VIA DO CLIENTE & TERMO DE GARANTIA
                  </span>
                  <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-wider">
                    EMISSÃO: {formatDateTime(sale.saleDate || order.createdAt)}
                  </span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-black uppercase">
                  {companyInfo.name}
                </h1>
                <p className="text-[9px] font-black text-neutral-800 uppercase tracking-wider">
                  COMPROVANTE DE PEDIDO & CERTIFICADO DE GARANTIA
                </p>
                <p className="text-[8px] text-neutral-600 mt-0.5">
                  CNPJ: {companyInfo.cnpj} • SAC / WhatsApp: {companyInfo.phone} • {companyInfo.address}
                </p>
              </div>

              {/* BOX RETANGULAR DO NÚMERO DO PEDIDO */}
              <div className="border-2 border-black bg-neutral-50 p-2 min-w-[200px] text-right rounded-none">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-neutral-500 block">
                  COMPROVANTE DO PEDIDO
                </span>
                <span className="text-2xl font-black text-black tracking-tight block font-mono">
                  {orderNumberInfo.badgeNumber}
                </span>
                <div className="mt-1 pt-1 border-t border-black/30 flex justify-between text-[8px]">
                  <span className="font-bold text-neutral-600">Ref: {orderNumberInfo.reference}</span>
                  <span className="font-black text-black uppercase">{seller?.name || "Balcão / Loja"}</span>
                </div>
              </div>
            </div>
          </header>

          {/* 1. DADOS DO CLIENTE & LOCAL DE ENTREGA */}
          <section className="mb-2 border border-black rounded-none">
            <div className="bg-black text-white px-2 py-1 flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
              <span>1. IDENTIFICAÇÃO DO CLIENTE & AGENDAMENTO</span>
              <span>DATA DA COMPRA: {formatDate(sale.saleDate || order.createdAt)}</span>
            </div>

            <div className="p-2 grid grid-cols-3 gap-2 text-[8.5px] bg-white">
              <div>
                <span className="font-bold text-neutral-500 uppercase text-[7px] block">Nome do Cliente</span>
                <span className="font-black text-black uppercase text-[9px]">{customer?.fullName || "Cliente"}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-500 uppercase text-[7px] block">CPF / CNPJ</span>
                <span className="font-bold text-neutral-900 font-mono">{customer?.document || "Não informado"}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-500 uppercase text-[7px] block">Telefone / WhatsApp</span>
                <span className="font-bold text-neutral-900 font-mono">{customer?.phone || customer?.whatsapp || "Não informado"}</span>
              </div>

              {mainAddress && (
                <div className="col-span-2 pt-1 border-t border-neutral-300">
                  <span className="font-bold text-neutral-500 uppercase text-[7px] block">Endereço de Entrega</span>
                  <span className="font-bold text-black">
                    {mainAddress.street}, {mainAddress.number}
                    {mainAddress.complement ? ` (${mainAddress.complement})` : ""}
                    {mainAddress.neighborhood ? ` • Bairro: ${mainAddress.neighborhood}` : ""}
                    {mainAddress.city ? ` • ${mainAddress.city}/${mainAddress.state}` : ""}
                    {mainAddress.zipCode ? ` • CEP: ${mainAddress.zipCode}` : ""}
                  </span>
                </div>
              )}

              <div className="pt-1 border-t border-neutral-300">
                <span className="font-bold text-neutral-500 uppercase text-[7px] block">Previsão de Entrega</span>
                <span className="font-black text-black font-mono">
                  {order.deliveryDate ? formatDate(order.deliveryDate) : "A combinar"}
                  {order.deliveryDate && ` (${formatTimeOnly(order.deliveryDate) || "Comercial"})`}
                </span>
              </div>
            </div>
          </section>

          {/* 2. DISCRIMINAÇÃO DOS PRODUTOS & VALORES CONTRATADOS */}
          <section className="mb-2 border border-black rounded-none">
            <div className="bg-black text-white px-2 py-1 flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
              <span>2. DISCRIMINAÇÃO DOS PRODUTOS & VALORES CONTRATADOS</span>
              <span>TOTAL DE ITENS: {items.length}</span>
            </div>

            <table className="w-full text-left text-[8px] border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-black border-b border-black text-[7.5px] uppercase font-black">
                  <th className="py-1 px-2 border-r border-neutral-300 w-8 text-center">Item</th>
                  <th className="py-1 px-2 border-r border-neutral-300">Descrição do Produto & Especificações</th>
                  <th className="py-1 px-2 border-r border-neutral-300 text-center w-12">Qtd</th>
                  <th className="py-1 px-2 border-r border-neutral-300 text-right w-24">Valor Unit.</th>
                  <th className="py-1 px-2 text-right w-24">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {items.map((item: any, idx: number) => {
                  const specs = extractTechnicalSpecs(item);
                  return (
                    <tr key={item.id || idx} className="text-black">
                      <td className="py-1 px-2 font-black text-center border-r border-neutral-300 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="py-1 px-2 border-r border-neutral-300">
                        <p className="font-black uppercase text-[8.5px] text-black">{item.description}</p>
                        <p className="text-[7.5px] text-neutral-700">
                          {specs.actualW > 0 ? `Medidas: ${specs.actualW}x${specs.actualL}x${specs.actualH}cm • ` : ""}
                          {specs.topFabricName ? `Tampo: ${specs.topFabricName} • ` : ""}
                          {specs.sideFabricName ? `Lateral: ${specs.sideFabricName} • ` : ""}
                          {specs.density ? `Densidade: ${specs.density} • ` : ""}
                          {specs.foamService && specs.foamService !== "NENHUM" ? `Pillow: ${specs.foamService} • ` : ""}
                          {specs.boxType ? `Box: ${specs.boxType}` : ""}
                        </p>
                        {specs.technicalNotes && (
                          <p className="text-[7px] text-neutral-600 italic mt-0.5">
                            Obs: {specs.technicalNotes}
                          </p>
                        )}
                      </td>
                      <td className="py-1 px-2 text-center font-black border-r border-neutral-300 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-1 px-2 text-right font-medium text-neutral-800 border-r border-neutral-300 font-mono">
                        {formatBRL(item.unitPrice)}
                      </td>
                      <td className="py-1 px-2 text-right font-black text-black font-mono">
                        {formatBRL(item.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* TOTALIZADORES E FORMAS DE PAGAMENTO */}
            <div className="border-t-2 border-black p-2 bg-neutral-50 grid grid-cols-2 gap-4 text-[8.5px]">
              {/* LADO ESQUERDO: FORMA DE PAGAMENTO */}
              <div className="border-r border-black/30 pr-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-neutral-700 uppercase text-[7.5px]">Forma de Pagamento:</span>
                  <span className="font-black uppercase text-[7.5px] px-1.5 py-0.5 bg-black text-white">
                    {sale.financialStatus === "PAID" ? "PAGO ANTECIPADO" : "A RECEBER NA ENTREGA"}
                  </span>
                </div>

                {installments.length > 0 ? (
                  <div className="space-y-0.5">
                    {installments.map((inst: any) => (
                      <div key={inst.id} className="flex justify-between items-center text-[8px] bg-white p-1 border border-neutral-300">
                        <span className="font-bold text-black">
                          {inst.installmentNumber}x {inst.paymentMethod?.name || "Pagamento"}
                        </span>
                        <span className="font-mono font-black text-black">{formatBRL(inst.amount)}</span>
                        <span className="text-neutral-500 text-[7.5px]">Venc: {formatDate(inst.dueDate)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[8px] font-bold text-neutral-700 bg-white p-1 border border-neutral-300">
                    Condição combinada no balcão / faturamento direto
                  </p>
                )}

                {/* NOTAS FINANCEIRAS / ENTRADA NO ATO */}
                {sale.notes && (
                  <p className="text-[7.5px] font-bold text-neutral-800 bg-white p-1 border border-neutral-300">
                    {sale.notes}
                  </p>
                )}
              </div>

              {/* LADO DIREITO: VALORES E TOTAIS */}
              <div className="flex flex-col justify-between pl-1">
                <div className="space-y-0.5 text-right text-[8px]">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal dos Produtos:</span>
                    <span className="font-mono font-bold text-black">{formatBRL(sale.subtotalAmount)}</span>
                  </div>
                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between text-neutral-700">
                      <span>Desconto Aplicado:</span>
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

                <div className="border-t-2 border-black pt-1 mt-1 flex justify-between items-baseline">
                  <span className="font-black text-xs uppercase tracking-tight text-black">TOTAL DO PEDIDO:</span>
                  <span className="text-base font-black text-black font-mono tracking-tight">
                    {formatBRL(sale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* PARTE INFERIOR: TERMO DE GARANTIA E PROTOCOLO DE RECEBIMENTO */}
        <div className="mt-1 pt-0.5">
          {/* 3. CERTIFICADO DE GARANTIA & MANUAL DE CUIDADOS */}
          <section className="mb-1 border border-black rounded-none bg-white">
            <div className="bg-black text-white px-2 py-0.5 text-[7.5px] font-black uppercase tracking-wider flex justify-between">
              <span>3. CERTIFICADO DE GARANTIA & MANUAL DE CUIDADOS (SPA DO COLCHÃO)</span>
              <span>NORMA TÉCNICA ABNT NBR 15413</span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-black text-[7.5px] leading-snug">
              {/* COLUNA 1: PRAZOS */}
              <div className="p-1.5 space-y-0.5">
                <p className="font-black text-black uppercase text-[7.5px] mb-0.5">
                  1. PRAZOS E COBERTURA
                </p>
                <p>
                  • <strong>Molas e Estrutura:</strong> 1 (um) ano contra vícios ou defeitos de fabricação na madeira ou molejo.
                </p>
                <p>
                  • <strong>Espumas e Sustentação:</strong> 1 (um) ano. Conforme a norma <strong>ABNT NBR 15413</strong>, acomodação natural de até 10% nas áreas de maior apoio corporal é assentamento normal das fibras e espumas, não caracterizando defeito.
                </p>
                <p>
                  • <strong>Tecidos e Costuras:</strong> 90 dias legais contra desfiamento espontâneo de costuras.
                </p>
              </div>

              {/* COLUNA 2: CUIDADOS */}
              <div className="p-1.5 space-y-0.5">
                <p className="font-black text-black uppercase text-[7.5px] mb-0.5">
                  2. MANUAL DE CONSERVAÇÃO
                </p>
                <p>
                  • <strong>Giro Obrigatório:</strong> Nos primeiros 3 meses, gire o colchão (cabeça/pés) a cada 15 dias. Após esse período, gire mensalmente para assentamento uniforme.
                </p>
                <p>
                  • <strong>Base de Apoio:</strong> Apoiar sobre base ou estrado plano e nivelado, sem vãos livres maiores que 6 cm.
                </p>
                <p>
                  • <strong>Proteção:</strong> Obrigatório o uso de protetor impermeável de colchão. Não molhar e manter o quarto ventilado.
                </p>
              </div>

              {/* COLUNA 3: EXCLUSÕES */}
              <div className="p-1.5 space-y-0.5">
                <p className="font-black text-black uppercase text-[7.5px] mb-0.5">
                  3. EXCLUSÕES DA GARANTIA
                </p>
                <p>• Danos por umidade, mofo, derramamento de líquidos, urina ou produtos abrasivos.</p>
                <p>• Deformações decorrentes de estrado inadequado ou peso superior ao limite nominal da densidade.</p>
                <p>• Rasgos, furos por objetos pontiagudos ou fios puxados por animais domésticos.</p>
                <p>• Remoção, violação ou ausência da etiqueta de identificação da fábrica.</p>
              </div>
            </div>
          </section>

          {/* 4. PROTOCOLO DE RECEBIMENTO & ASSINATURA DO CLIENTE */}
          <footer className="border border-black p-1.5 bg-neutral-50 rounded-none">
            <div className="flex items-center justify-between text-[7.5px] font-black uppercase tracking-wider text-black mb-0.5">
              <span>4. PROTOCOLO DE RECEBIMENTO & ASSINATURA DO CLIENTE</span>
              <span className="font-mono">{orderNumberInfo.badgeNumber}</span>
            </div>

            <p className="text-[7.5px] text-neutral-700 mb-1 leading-tight">
              Declaro ter recebido os produtos descritos no <strong>{orderNumberInfo.badgeNumber}</strong> em perfeitas
              condições de acabamento, medidas e funcionamento, conferi as especificações contratadas e confirmo ciência
              dos Termos de Garantia e Cuidados estipulados acima.
            </p>

            <div className="grid grid-cols-4 gap-2 items-end pt-1">
              <div className="border-b border-black pb-0.5">
                <span className="text-[6.5px] text-neutral-500 uppercase block">Nome do Recebedor:</span>
                <span className="text-[8px] font-black uppercase text-black truncate block">
                  {order.recipientName || customer?.fullName || "___________________________"}
                </span>
              </div>
              <div className="border-b border-black pb-0.5">
                <span className="text-[6.5px] text-neutral-500 uppercase block">Documento (CPF / RG):</span>
                <span className="text-[8px] font-bold text-black font-mono">
                  {customer?.document || "___________________________"}
                </span>
              </div>
              <div className="border-b border-black pb-0.5 text-center">
                <span className="text-[6.5px] text-neutral-500 uppercase block">Data e Horário:</span>
                <span className="text-[8px] font-bold text-black font-mono">____ / ____ / 2026 às ____:____</span>
              </div>
              <div className="border-b border-black pb-0.5 text-center">
                <span className="text-[6.5px] text-neutral-500 uppercase block">Assinatura do Recebedor:</span>
                <span className="text-[7px] text-neutral-400">Assinatura</span>
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
      <div className="w-[80mm] max-w-[80mm] bg-white text-black font-sans mx-auto p-2 text-[10px] leading-tight border border-black rounded-none">
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <span className="text-[8px] font-black uppercase text-neutral-600 block">SPA DO COLCHÃO</span>
          <h1 className="text-lg font-black uppercase text-black font-mono">{orderNumberInfo.badgeNumber}</h1>
          <p className="text-[8px] font-bold text-neutral-800 uppercase">Comprovante de Pedido & Garantia</p>
          <p className="text-[8px] text-neutral-500">
            Ref: {orderNumberInfo.reference} • {formatDateTime(sale.saleDate || order.createdAt)}
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
