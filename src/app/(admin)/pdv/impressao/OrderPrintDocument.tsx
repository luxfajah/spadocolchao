"use client";

import React from "react";

interface OrderPrintDocumentProps {
  order: any;
  format: "thermal" | "a4";
  copies: 1 | 2;
  companyInfo?: {
    name?: string;
    tradeName?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
  };
}

const formatBRL = (value: number | null | undefined) => {
  if (typeof value !== "number") return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const formatDate = (date: any) => {
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

const formatDateTime = (date: any) => {
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

export function OrderPrintDocument({
  order,
  format,
  copies,
  companyInfo = {
    name: "SPA DO COLCHÃO",
    tradeName: "Indústria & Reforma de Colchões",
    cnpj: "00.000.000/0001-00",
    phone: "(11) 99999-9999",
    address: "Fábrica e Loja Especializada",
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

  // ==========================================
  // RENDERIZAÇÃO: FICHA CORPORATIVA A4
  // ==========================================
  const renderA4CorporateSheet = (viaLabel: string, copyIndex: number) => {
    return (
      <div
        key={`a4-${copyIndex}`}
        className={`w-full max-w-[210mm] bg-white text-slate-900 font-sans mx-auto p-8 shadow-sm border border-slate-300 rounded-none print:shadow-none print:border-none print:p-0 print:m-0 text-[11px] leading-tight ${
          copyIndex > 1 ? "print:break-before-page mt-8 pt-8 border-t-2 border-dashed border-slate-400" : ""
        }`}
      >
        {/* CABEÇALHO CORPORATIVO */}
        <header className="border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded">
                  {viaLabel}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Emissão: {formatDateTime(sale.saleDate || order.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase mt-1">
                {companyInfo.name}
              </h1>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                FICHA TÉCNICA DE PRODUÇÃO & ORDEM DE EXPEDIÇÃO
              </p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                CNPJ: {companyInfo.cnpj} • Contato: {companyInfo.phone}
              </p>
            </div>

            {/* BOX DESTAQUE NÚMERO DO PEDIDO */}
            <div className="text-right border-2 border-slate-900 bg-slate-50 rounded-xl p-2.5 min-w-[200px]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                Nº DA VENDA / PEDIDO
              </span>
              <span className="text-xl font-black text-slate-950 tracking-tight block">
                #{sale.number || order.id.slice(-6).toUpperCase()}
              </span>
              <div className="mt-1 pt-1 border-t border-slate-200 flex justify-between text-[9px]">
                <span className="text-slate-500 font-bold">Vendedor:</span>
                <span className="font-black text-slate-900">{seller?.name || "Balcão / Loja"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* BLOCO 1: CRONOGRAMA DE LOGÍSTICA & AGENDAMENTOS (PRIORIDADE DA PRODUÇÃO) */}
        <section className="mb-3 border-2 border-slate-900 rounded-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-3 py-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span>1. CRONOGRAMA DE PRODUÇÃO & LOGÍSTICA AGENDADA</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-[8px]">
              Status: {order.currentStatus === "SOLD" ? "Vendido / Em Fila" : order.currentStatus}
            </span>
          </div>

          <div className="p-2.5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/60">
            {/* RETIRADA */}
            <div className={`p-2 rounded-lg border ${order.pickupDate ? "bg-amber-50/80 border-amber-300" : "bg-white border-slate-200 opacity-60"}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black uppercase text-amber-950">📦 RETIRADA AGENDADA (COLETA)</span>
                <span className="text-[8px] font-bold text-amber-800">
                  {order.pickupDate ? "Coleta no Cliente" : "Não aplicável"}
                </span>
              </div>
              <p className="text-sm font-black text-amber-950">
                {order.pickupDate ? formatDate(order.pickupDate) : "Sem data agendada"}
              </p>
              {order.pickupDate && (
                <p className="text-[9px] font-bold text-amber-800 mt-0.5">
                  Horário / Turno: {new Date(order.pickupDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            {/* ENTREGA */}
            <div className={`p-2 rounded-lg border ${order.deliveryDate ? "bg-emerald-50/80 border-emerald-300" : "bg-white border-slate-200 opacity-60"}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-black uppercase text-emerald-950">🚚 ENTREGA AGENDADA (EXPEDIÇÃO)</span>
                <span className="text-[8px] font-bold text-emerald-800">
                  {order.deliveryDate ? "Data Limite Fábrica" : "Não agendada"}
                </span>
              </div>
              <p className="text-sm font-black text-emerald-950">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "Sem data agendada"}
              </p>
              {order.deliveryDate && (
                <p className="text-[9px] font-bold text-emerald-800 mt-0.5">
                  Horário / Turno: {new Date(order.deliveryDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            {/* INFORMAÇÕES DE RECEBIMENTO E ROTA */}
            <div className="md:col-span-2 pt-1 border-t border-slate-200 text-[10px] space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-600">Recebedor no Local: </span>
                  <span className="font-black text-slate-900">{order.recipientName || customer?.fullName || "Cliente"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600">Telefone de Contato: </span>
                  <span className="font-black text-slate-900">{order.recipientPhone || customer?.phone || customer?.whatsapp || "---"}</span>
                </div>
              </div>
              {order.notes && (
                <div className="bg-white p-1.5 rounded border border-slate-200 text-slate-800 font-medium">
                  <span className="font-black text-slate-900 uppercase text-[9px] block">Instruções de Logística / Rota:</span>
                  <span>{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* BLOCO 2: DADOS DO CLIENTE */}
        <section className="mb-3 border border-slate-300 rounded-xl p-2.5 bg-white">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-1.5">
            2. IDENTIFICAÇÃO DO CLIENTE
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="font-bold text-slate-500 block text-[8px] uppercase">Nome Completo</span>
              <span className="font-black text-slate-900 text-xs uppercase">{customer?.fullName || "Não informado"}</span>
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
              <div className="md:col-span-3 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-500 text-[8px] uppercase block">Endereço de Entrega</span>
                <span className="font-semibold text-slate-900">
                  {mainAddress.street}, {mainAddress.number}
                  {mainAddress.complement ? ` (${mainAddress.complement})` : ""}
                  {mainAddress.neighborhood ? ` • Bairro: ${mainAddress.neighborhood}` : ""}
                  {mainAddress.city ? ` • Cidade: ${mainAddress.city}/${mainAddress.state}` : ""}
                  {mainAddress.zipCode ? ` • CEP: ${mainAddress.zipCode}` : ""}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* BLOCO 3: FICHA TÉCNICA DE PRODUÇÃO (OS PRODUTOS E ESCOLHAS DO PDV) */}
        <section className="mb-3 border-2 border-slate-900 rounded-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-3 py-1 flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span>3. ESPECIFICAÇÕES TÉCNICAS DE FABRICAÇÃO / REFORMA (CHÃO DE FÁBRICA)</span>
            <span>TOTAL DE ITENS: {items.length}</span>
          </div>

          <div className="divide-y-2 divide-slate-300">
            {items.map((item: any, idx: number) => {
              const reformMattress = item.detailMattressReform;
              const newMattress = item.detailNewMattress;
              const reformBox = item.detailBoxReform;
              const newBox = item.detailNewBox;
              const cleaning = item.detailUpholsteryCleaning;

              const actualW = reformMattress?.actualWidth || newMattress?.actualWidth || reformBox?.actualWidth || newBox?.actualWidth || 0;
              const actualL = reformMattress?.actualLength || newMattress?.actualLength || reformBox?.actualLength || newBox?.actualLength || 0;
              const actualH = reformMattress?.actualHeight || newMattress?.actualHeight || reformBox?.actualHeight || newBox?.actualHeight || 0;
              const commercialSize = reformMattress?.commercialSize || newMattress?.commercialSize || reformBox?.commercialSize || newBox?.commercialSize;

              return (
                <div key={item.id || idx} className="p-3 bg-white space-y-2">
                  {/* Título do Item e Quantidade */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded">
                          ITEM #{idx + 1}
                        </span>
                        <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                          {item.description}
                        </h3>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                        Categoria / Operação: {item.productService?.type || item.type || "Fabricação Própria"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="bg-slate-100 text-slate-900 font-black text-sm px-3 py-1 rounded-lg border border-slate-300 inline-block">
                        QTD: {item.quantity} UN
                      </span>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5">
                        Unitário: {formatBRL(item.unitPrice)} • Total: {formatBRL(item.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* GRID TÉCNICA PRINCIPAL (MEDIDAS E MATERIAIS) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-[10px]">
                    {/* MEDIDAS DE CORTE (4 COLUNAS EM DESTAQUE) */}
                    <div className="md:col-span-4 bg-slate-100 p-2.5 rounded-lg border border-slate-300">
                      <span className="font-black text-[9px] uppercase tracking-wider text-slate-600 block mb-1">
                        📏 MEDIDAS DE CORTE / PRODUÇÃO
                      </span>
                      {actualW > 0 || actualL > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-base font-black text-slate-950 font-mono tracking-tight">
                            {actualW} x {actualL} {actualH > 0 ? `x ${actualH}` : ""} cm
                          </p>
                          <p className="text-[9px] font-bold text-slate-600">
                            Largura: {actualW}cm • Comprimento: {actualL}cm {actualH > 0 ? `• Altura: ${actualH}cm` : ""}
                          </p>
                          {commercialSize && (
                            <p className="text-[9px] font-black text-blue-900 uppercase mt-1">
                              Padrão: {commercialSize}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="font-bold text-slate-700">Dimensões padrão de catálogo</p>
                      )}
                    </div>

                    {/* MATERIAIS & REVESTIMENTOS (8 COLUNAS) */}
                    <div className="md:col-span-8 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200">
                      <span className="font-black text-[9px] uppercase tracking-wider text-blue-900 block mb-1">
                        🧵 REVESTIMENTOS & ACABAMENTOS ESCOLHIDOS NO PDV
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {/* Tampo */}
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">Tecido Tampo</span>
                          <span className="font-black text-slate-900">
                            {reformMattress?.topFabricColor || newMattress?.topFabricColor || reformBox?.topFabricColor || newBox?.topFabricColor || "Padrão"}
                          </span>
                        </div>
                        {/* Lateral */}
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">Faixa Lateral</span>
                          <span className="font-black text-slate-900">
                            {reformMattress?.sideFabricColor || newMattress?.sideFabricColor || reformBox?.sideFabricColor || newBox?.sideFabricColor || "Padrão"}
                          </span>
                        </div>
                        {/* Densidade / Conforto */}
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block">Densidade / Espuma</span>
                          <span className="font-black text-slate-900">
                            {reformMattress?.density || newMattress?.density || "Conforme ficha"}
                          </span>
                        </div>
                        {/* Camada Extra / Pillow */}
                        {reformMattress?.foamServiceType && reformMattress.foamServiceType !== "NENHUM" && (
                          <div className="sm:col-span-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Camada de Conforto / Pillow</span>
                            <span className="font-black text-emerald-900">
                              ✦ {reformMattress.foamServiceType} (+{reformMattress.addedFoamHeight || 0} cm)
                            </span>
                          </div>
                        )}
                        {/* Box / Pés */}
                        {(newBox || reformBox) && (
                          <div className="sm:col-span-2">
                            <span className="text-[8px] font-bold text-slate-500 uppercase block">Estrutura Box / Baú</span>
                            <span className="font-black text-amber-900">
                              Tipo: {(newBox?.boxType || reformBox?.boxType || "Comum").toUpperCase()}
                              {(newBox?.optStructureReinforce || reformBox?.optStructureReinforce) ? " • Reforço Estrutural" : ""}
                              {(newBox?.optHardwareReplacement || reformBox?.optHardwareReplacement) ? " • Troca de Ferragens" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RESUMO DE ESCOLHAS DIGITADAS / NOTAS TÉCNICAS DO PDV */}
                  {item.notes && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-2 text-[10px] text-amber-950">
                      <span className="font-black uppercase tracking-wider text-[8px] text-amber-900 block mb-0.5">
                        📝 RESUMO DAS ESCOLHAS DO CLIENTE & NOTAS DE PRODUÇÃO:
                      </span>
                      <p className="font-medium whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}

                  {/* ITENS DE HIGIENIZAÇÃO SE HOUVER */}
                  {cleaning?.rows && cleaning.rows.length > 0 && (
                    <div className="bg-teal-50/70 border border-teal-300 rounded-lg p-2 text-[9px] text-teal-950">
                      <span className="font-black uppercase tracking-wider text-[8px] text-teal-900 block mb-1">
                        🧼 ESPECIFICAÇÃO DE HIGIENIZAÇÃO / IMPERMEABILIZAÇÃO:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {cleaning.rows.map((row: any, rIdx: number) => (
                          <div key={row.id || rIdx} className="bg-white p-1 rounded border border-teal-200">
                            <span className="font-black text-teal-900">{row.quantity}x {row.objectType}</span>
                            {row.observation && <p className="text-[8px] text-slate-500">{row.observation}</p>}
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

        {/* BLOCO 4: RESUMO COMERCIAL & CONDIÇÕES DE PAGAMENTO */}
        <section className="mb-3 border border-slate-300 rounded-xl p-2.5 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5 text-[10px]">
              <span className="font-bold text-slate-500 uppercase text-[8px] block">Condição Financeira</span>
              <p className="font-black text-slate-900">
                Status: {sale.financialStatus === "PAID" ? "PAGO ANTECIPADO" : "A RECEBER NA ENTREGA"}
              </p>
              {installments.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[9px] text-slate-700 mt-1">
                  {installments.map((inst: any) => (
                    <span key={inst.id} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                      {inst.installmentNumber}x {inst.paymentMethod?.name || "Pagamento"} ({formatBRL(inst.amount)}) • Venc: {formatDate(inst.dueDate)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right border-l border-slate-300 pl-4 space-y-0.5">
              <div className="text-[10px] text-slate-600 font-semibold space-x-2">
                <span>Subtotal: {formatBRL(sale.subtotalAmount)}</span>
                {sale.discountAmount > 0 && <span className="text-emerald-700">Desc: -{formatBRL(sale.discountAmount)}</span>}
                {sale.surchargeAmount > 0 && <span>Acrésc: +{formatBRL(sale.surchargeAmount)}</span>}
              </div>
              <p className="text-xl font-black text-slate-950 font-outfit">
                TOTAL: {formatBRL(sale.totalAmount)}
              </p>
            </div>
          </div>
        </section>

        {/* BLOCO 5: ROTEIRO DE CONTROLE DE QUALIDADE DA FÁBRICA */}
        <section className="mb-4 border border-slate-400 rounded-xl p-2.5 bg-white">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex justify-between">
            <span>4. ROTEIRO DE FABRICAÇÃO & CONTROLE DE QUALIDADE (CHÃO DE FÁBRICA)</span>
            <span>PREENCHIMENTO OBRIGATÓRIO</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px]">
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-700 block">[ ] 1. Marcenaria / Estrutura</span>
              <p className="text-[8px] text-slate-400 mt-1">Resp: _____________________</p>
              <p className="text-[8px] text-slate-400 mt-0.5">Data: ___/___/2026</p>
            </div>
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-700 block">[ ] 2. Corte de Espuma</span>
              <p className="text-[8px] text-slate-400 mt-1">Resp: _____________________</p>
              <p className="text-[8px] text-slate-400 mt-0.5">Data: ___/___/2026</p>
            </div>
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-700 block">[ ] 3. Costura & Fechamento</span>
              <p className="text-[8px] text-slate-400 mt-1">Resp: _____________________</p>
              <p className="text-[8px] text-slate-400 mt-0.5">Data: ___/___/2026</p>
            </div>
            <div className="border border-slate-200 rounded p-1.5 bg-slate-50">
              <span className="font-bold text-slate-700 block">[ ] 4. Qualidade & Embalagem</span>
              <p className="text-[8px] text-slate-400 mt-1">Resp: _____________________</p>
              <p className="text-[8px] text-slate-400 mt-0.5">Data: ___/___/2026</p>
            </div>
          </div>
        </section>

        {/* BLOCO 6: CANHOTO DE ENTREGA DESTACÁVEL */}
        <footer className="border-t-2 border-dashed border-slate-400 pt-2.5">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <span>✂ DESTACAR NO ATO DA ENTREGA / EXPEDIÇÃO</span>
            <span>PROTOCOLO DE ENTREGA DO CLIENTE</span>
          </div>

          <p className="text-[9px] text-slate-600 mb-3">
            Declaro ter recebido os produtos descritos nesta Ordem de Produção (#{sale.number}) em perfeitas condições e de acordo com as especificações contratadas.
          </p>

          <div className="grid grid-cols-2 gap-6 items-end">
            <div className="border-t border-slate-900 pt-1 text-center">
              <span className="text-[9px] font-bold uppercase text-slate-900 block">
                {order.recipientName || customer?.fullName || "Assinatura do Recebedor"}
              </span>
              <span className="text-[8px] text-slate-400">Assinatura do Cliente / Recebedor</span>
            </div>
            <div className="border-t border-slate-900 pt-1 text-center">
              <span className="text-[9px] font-bold text-slate-900 block">____ / ____ / 2026</span>
              <span className="text-[8px] text-slate-400">Data e Horário de Recebimento</span>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  // ==========================================
  // RENDERIZAÇÃO: CUPOM TÉRMICO 80MM (OPCIONAL)
  // ==========================================
  const renderThermalSlip = (viaLabel: string, copyIndex: number) => {
    return (
      <div
        key={`thermal-${copyIndex}`}
        className={`w-[80mm] max-w-[80mm] bg-white text-slate-900 font-sans mx-auto p-2 text-[10px] leading-tight ${
          copyIndex > 1 ? "print:break-before-page mt-4 pt-4 border-t-2 border-dashed border-slate-400" : ""
        }`}
      >
        <div className="text-center border-b-2 border-slate-900 pb-2 mb-2">
          <span className="text-[8px] font-black uppercase text-slate-500 block">{viaLabel}</span>
          <h1 className="text-lg font-black uppercase text-slate-950">{companyInfo.name}</h1>
          <p className="text-[8px] font-bold text-slate-600 uppercase">Ficha Técnica & Expedição</p>
          <p className="text-[8px] text-slate-400">Venda: #{sale.number} • {formatDateTime(sale.saleDate)}</p>
        </div>

        {/* LOGÍSTICA AGENDADA */}
        <div className="mb-2 p-1.5 rounded bg-slate-100 border border-slate-300 space-y-1">
          {order.pickupDate && (
            <p className="font-bold text-amber-950">📦 Retirada: <span className="font-black">{formatDate(order.pickupDate)}</span></p>
          )}
          {order.deliveryDate && (
            <p className="font-bold text-emerald-950">🚚 Entrega: <span className="font-black">{formatDate(order.deliveryDate)}</span></p>
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
          {items.map((item: any, idx: number) => (
            <div key={idx} className="text-[9px]">
              <div className="flex justify-between font-black">
                <span>{item.quantity}x {item.description}</span>
                <span>{formatBRL(item.totalAmount)}</span>
              </div>
              {item.notes && (
                <p className="text-[8px] text-slate-600 bg-slate-50 p-1 rounded mt-0.5 leading-tight">
                  {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div className="mb-3 flex justify-between font-black text-sm border-b-2 border-slate-900 pb-1">
          <span>TOTAL:</span>
          <span>{formatBRL(sale.totalAmount)}</span>
        </div>

        {/* CANHOTO */}
        <div className="pt-2 text-center text-[8px] text-slate-500">
          <p className="mb-4">Recebi os produtos em perfeitas condições.</p>
          <div className="border-t border-slate-900 pt-1">
            <p className="font-bold text-slate-800 uppercase">{customer?.fullName || "Assinatura do Cliente"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-print-container w-full">
      {format === "a4" ? (
        <>
          {renderA4CorporateSheet(copies === 2 ? "1ª VIA: EXPEDIÇÃO & CLIENTE" : "VIA ÚNICA DE PRODUÇÃO", 1)}
          {copies === 2 && renderA4CorporateSheet("2ª VIA: FÁBRICA & PRODUÇÃO", 2)}
        </>
      ) : (
        <>
          {renderThermalSlip(copies === 2 ? "1ª VIA: CLIENTE" : "VIA ÚNICA", 1)}
          {copies === 2 && renderThermalSlip("2ª VIA: PRODUÇÃO", 2)}
        </>
      )}
    </div>
  );
}
