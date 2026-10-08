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
    tradeName: "Fábrica e Reforma de Colchões",
    cnpj: "00.000.000/0001-00",
    phone: "(11) 99999-9999",
    address: "Atendimento e Fábrica Especializada",
  },
}: OrderPrintDocumentProps) {
  if (!order || !order.sale) {
    return (
      <div className="p-8 text-center text-sm font-bold text-slate-500">
        Nenhum pedido selecionado para impressão.
      </div>
    );
  }

  const { sale } = order;
  const { customer, seller, items = [], installments = [] } = sale;
  const addresses = customer?.addresses || [];
  const mainAddress = addresses.find((a: any) => a.isMain) || addresses[0];

  const renderSingleSlip = (viaLabel: string, copyIndex: number) => {
    const isThermal = format === "thermal";

    return (
      <div
        key={copyIndex}
        className={`bg-white text-slate-900 font-sans ${
          isThermal
            ? "w-[80mm] max-w-[80mm] p-2 text-[10px] leading-tight mx-auto"
            : "w-full max-w-[210mm] p-8 text-xs leading-normal mx-auto border border-slate-200 rounded-xl mb-8 print:border-none print:p-0 print:mb-0"
        } ${copyIndex > 1 ? "print:break-before-page mt-6 pt-6 border-t-2 border-dashed border-slate-300" : ""}`}
      >
        {/* CABEÇALHO */}
        <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">
            <span>{viaLabel}</span>
            <span>EMISSÃO: {formatDateTime(sale.saleDate || order.createdAt)}</span>
          </div>

          <h1 className={`font-black tracking-tight text-slate-950 uppercase ${isThermal ? "text-lg" : "text-2xl"}`}>
            {companyInfo.name}
          </h1>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{companyInfo.tradeName}</p>
          <div className="text-[8px] text-slate-500 mt-0.5 space-x-2">
            <span>CNPJ: {companyInfo.cnpj}</span>
            <span>•</span>
            <span>TEL: {companyInfo.phone}</span>
          </div>
          {companyInfo.address && (
            <p className="text-[8px] text-slate-500 mt-0.5">{companyInfo.address}</p>
          )}

          {/* TARJA IDENTIFICADORA DO PEDIDO */}
          <div className="mt-2.5 rounded-lg bg-slate-900 text-white p-2 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[7px] uppercase tracking-widest text-slate-300 block">Identificação</span>
              <span className="font-black text-sm tracking-tight">VENDA Nº {sale.number || "---"}</span>
            </div>
            <div className="text-right">
              <span className="text-[7px] uppercase tracking-widest text-slate-300 block">Vendedor</span>
              <span className="font-bold text-xs">{seller?.name || "Balcão / Loja"}</span>
            </div>
          </div>
        </div>

        {/* BLOCO SUPER DESTAQUE: RETIRADA E ENTREGA AGENDADA */}
        <div className="mb-3 rounded-lg border-2 border-slate-900 bg-slate-50 p-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
            <span className="font-black text-[9px] uppercase tracking-widest text-slate-900 flex items-center gap-1">
              LOGÍSTICA & AGENDAMENTOS
            </span>
            <span className="text-[8px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 uppercase">
              {order.currentStatus === "SOLD" ? "Venda Confirmada" : order.currentStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* RETIRADA */}
            <div className={`p-2 rounded bg-amber-50 border border-amber-300 ${!order.pickupDate ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-black uppercase text-amber-900">📦 RETIRADA AGENDADA</span>
              </div>
              <p className="font-black text-[11px] text-amber-950">
                {order.pickupDate ? formatDate(order.pickupDate) : "Não agendada"}
              </p>
              {order.pickupDate && (
                <p className="text-[8px] font-bold text-amber-800">
                  Horário: {new Date(order.pickupDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            {/* ENTREGA */}
            <div className={`p-2 rounded bg-emerald-50 border border-emerald-300 ${!order.deliveryDate ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-black uppercase text-emerald-900">🚚 ENTREGA AGENDADA</span>
              </div>
              <p className="font-black text-[11px] text-emerald-950">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "Não agendada"}
              </p>
              {order.deliveryDate && (
                <p className="text-[8px] font-bold text-emerald-800">
                  Horário: {new Date(order.deliveryDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>

          {/* Destinatário ou Recebedor alternativo */}
          {(order.recipientName || order.recipientPhone) && (
            <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9px] flex flex-wrap justify-between gap-1">
              <div>
                <span className="font-bold text-slate-500">Recebedor no local: </span>
                <span className="font-black text-slate-800">{order.recipientName || customer?.fullName}</span>
              </div>
              {order.recipientPhone && (
                <div>
                  <span className="font-bold text-slate-500">Contato: </span>
                  <span className="font-black text-slate-800">{order.recipientPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Instruções de logística / entrega */}
          {order.notes && (
            <div className="mt-1.5 pt-1 border-t border-slate-200 text-[8px] text-slate-700">
              <span className="font-bold text-slate-900">Instruções / Rota: </span>
              <span>{order.notes}</span>
            </div>
          )}
        </div>

        {/* INFORMAÇÕES DO CLIENTE */}
        <div className="mb-3 border border-slate-300 rounded-lg p-2.5">
          <div className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 border-b border-slate-100 pb-0.5">
            DADOS DO CLIENTE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
            <div>
              <span className="font-bold text-slate-500">Nome: </span>
              <span className="font-black text-slate-900 uppercase">{customer?.fullName || "Cliente não informado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">CPF/CNPJ: </span>
              <span className="font-bold text-slate-800">{customer?.document || "Não informado"}</span>
            </div>
            <div>
              <span className="font-bold text-slate-500">Telefone/WhatsApp: </span>
              <span className="font-bold text-slate-800">{customer?.phone || customer?.whatsapp || "Não informado"}</span>
            </div>
            {mainAddress && (
              <div className="sm:col-span-2 mt-0.5 pt-0.5 border-t border-slate-100">
                <span className="font-bold text-slate-500">Endereço de Entrega: </span>
                <span className="font-semibold text-slate-800">
                  {mainAddress.street}, {mainAddress.number}
                  {mainAddress.complement ? ` - ${mainAddress.complement}` : ""}
                  {mainAddress.neighborhood ? `, ${mainAddress.neighborhood}` : ""}
                  {mainAddress.city ? ` - ${mainAddress.city}/${mainAddress.state}` : ""}
                  {mainAddress.zipCode ? ` (CEP: ${mainAddress.zipCode})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ITENS DO PEDIDO E DETALHES DE PERSONALIZAÇÃO */}
        <div className="mb-3">
          <div className="text-[8px] font-black uppercase tracking-widest text-slate-900 mb-1 border-b-2 border-slate-900 pb-0.5 flex items-center justify-between">
            <span>ITENS E PERSONALIZAÇÃO (FORMULÁRIO PDV)</span>
            <span>QTD / VALOR</span>
          </div>

          <div className="divide-y divide-slate-200">
            {items.map((item: any, idx: number) => {
              const reformMattress = item.detailMattressReform;
              const newMattress = item.detailNewMattress;
              const reformBox = item.detailBoxReform;
              const newBox = item.detailNewBox;
              const cleaning = item.detailUpholsteryCleaning;

              return (
                <div key={item.id || idx} className="py-2 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-[11px] text-slate-900">{item.quantity}x</span>
                        <span className="font-black text-[10px] text-slate-900 uppercase">{item.description}</span>
                      </div>
                      {item.productService?.type && (
                        <span className="text-[8px] font-bold text-slate-500 uppercase">
                          Categoria: {item.productService.type}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-[11px] text-slate-900">{formatBRL(item.totalAmount)}</span>
                      {item.quantity > 1 && (
                        <p className="text-[7px] text-slate-400 font-bold">({formatBRL(item.unitPrice)} un)</p>
                      )}
                    </div>
                  </div>

                  {/* RESUMO DE PERSONALIZAÇÃO SALVO NO PDV */}
                  {item.notes && (
                    <div className="rounded bg-slate-100/90 border border-slate-200 p-1.5 text-[8px] text-slate-800 leading-snug">
                      <span className="font-black text-slate-900 uppercase block mb-0.5">
                        ✦ Especificações Selecionadas no PDV:
                      </span>
                      <p className="whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}

                  {/* DETALHES ESTRUTURADOS: REFORMA DE COLCHÃO */}
                  {reformMattress && (
                    <div className="rounded bg-blue-50/70 border border-blue-200 p-1.5 text-[8px] space-y-0.5 text-blue-950">
                      <p className="font-black uppercase text-[8px] text-blue-900">
                        Engenharia de Reforma (Colchão):
                      </p>
                      <div className="grid grid-cols-2 gap-x-2">
                        {reformMattress.actualWidth > 0 && (
                          <p>
                            <span className="font-bold">Medidas:</span> {reformMattress.actualWidth} x {reformMattress.actualLength} x {reformMattress.actualHeight} cm
                          </p>
                        )}
                        {reformMattress.commercialSize && (
                          <p><span className="font-bold">Padrão:</span> {reformMattress.commercialSize.toUpperCase()}</p>
                        )}
                        {reformMattress.topFabricColor && (
                          <p><span className="font-bold">Tecido Tampo:</span> {reformMattress.topFabricColor}</p>
                        )}
                        {reformMattress.sideFabricColor && (
                          <p><span className="font-bold">Tecido Lateral:</span> {reformMattress.sideFabricColor}</p>
                        )}
                        {reformMattress.density && (
                          <p><span className="font-bold">Densidade:</span> {reformMattress.density}</p>
                        )}
                        {reformMattress.foamServiceType && reformMattress.foamServiceType !== "NENHUM" && (
                          <p><span className="font-bold">Espuma/Pillow:</span> {reformMattress.foamServiceType} (+{reformMattress.addedFoamHeight || 0}cm)</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DETALHES ESTRUTURADOS: COLCHÃO NOVO */}
                  {newMattress && (
                    <div className="rounded bg-sky-50/70 border border-sky-200 p-1.5 text-[8px] space-y-0.5 text-sky-950">
                      <p className="font-black uppercase text-[8px] text-sky-900">
                        Fabricação de Colchão Novo:
                      </p>
                      <div className="grid grid-cols-2 gap-x-2">
                        {newMattress.actualWidth > 0 && (
                          <p>
                            <span className="font-bold">Dimensões:</span> {newMattress.actualWidth} x {newMattress.actualLength} x {newMattress.actualHeight} cm
                          </p>
                        )}
                        {newMattress.mattressType && (
                          <p><span className="font-bold">Modelo:</span> {newMattress.mattressType}</p>
                        )}
                        {newMattress.topFabricColor && (
                          <p><span className="font-bold">Tampo:</span> {newMattress.topFabricColor}</p>
                        )}
                        {newMattress.sideFabricColor && (
                          <p><span className="font-bold">Faixa:</span> {newMattress.sideFabricColor}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DETALHES ESTRUTURADOS: BOX NOVO OU REFORMA BOX */}
                  {(newBox || reformBox) && (
                    <div className="rounded bg-amber-50/70 border border-amber-200 p-1.5 text-[8px] space-y-0.5 text-amber-950">
                      <p className="font-black uppercase text-[8px] text-amber-900">
                        Box / Baú ({newBox ? "Novo" : "Reforma"}):
                      </p>
                      <div className="grid grid-cols-2 gap-x-2">
                        <p><span className="font-bold">Tipo:</span> {(newBox?.boxType || reformBox?.boxType || "comum").toUpperCase()}</p>
                        {(newBox?.topFabricColor || reformBox?.topFabricColor) && (
                          <p><span className="font-bold">Revestimento:</span> {newBox?.topFabricColor || reformBox?.topFabricColor}</p>
                        )}
                        {(newBox?.optStructureReinforce || reformBox?.optStructureReinforce) && (
                          <p className="font-bold text-amber-900">✦ Com reforço estrutural</p>
                        )}
                        {(newBox?.optHardwareReplacement || reformBox?.optHardwareReplacement) && (
                          <p className="font-bold text-amber-900">✦ Com troca de ferragens/pistões</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DETALHES ESTRUTURADOS: LIMPEZA DE ESTOFADOS */}
                  {cleaning?.rows && cleaning.rows.length > 0 && (
                    <div className="rounded bg-teal-50/70 border border-teal-200 p-1.5 text-[8px] space-y-1 text-teal-950">
                      <p className="font-black uppercase text-[8px] text-teal-900">
                        Itens para Higienização / Impermeabilização:
                      </p>
                      <div className="space-y-0.5">
                        {cleaning.rows.map((row: any, rIdx: number) => (
                          <div key={row.id || rIdx} className="flex justify-between border-b border-teal-100 last:border-0 pb-0.5">
                            <span>{row.quantity}x {row.objectType} {row.observation ? `(${row.observation})` : ""}</span>
                            <span className="font-bold">{formatBRL(row.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* VALORES E FORMAS DE PAGAMENTO */}
        <div className="mb-3 border-t-2 border-slate-900 pt-2 space-y-1.5">
          <div className="flex justify-between text-[9px] text-slate-600 font-bold uppercase">
            <span>Subtotal dos Produtos:</span>
            <span>{formatBRL(sale.subtotalAmount)}</span>
          </div>

          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-[9px] text-emerald-700 font-bold uppercase">
              <span>Desconto Comercial:</span>
              <span>-{formatBRL(sale.discountAmount)}</span>
            </div>
          )}

          {sale.surchargeAmount > 0 && (
            <div className="flex justify-between text-[9px] text-slate-700 font-bold uppercase">
              <span>Acréscimos / Frete:</span>
              <span>+{formatBRL(sale.surchargeAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-slate-950 border-t border-slate-300 pt-1.5">
            <span className="uppercase tracking-tight">TOTAL DA VENDA:</span>
            <span>{formatBRL(sale.totalAmount)}</span>
          </div>

          {/* PARCELAMENTO E CONDIÇÕES DE PAGAMENTO */}
          <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-200 p-2">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 border-b border-slate-200 pb-0.5">
              <span>CONDIÇÕES DE PAGAMENTO</span>
              <span>STATUS: {sale.financialStatus === "PAID" ? "PAGO" : "A RECEBER NA ENTREGA"}</span>
            </div>

            {installments.length > 0 ? (
              <div className="space-y-1 divide-y divide-slate-100">
                {installments.map((inst: any) => (
                  <div key={inst.id} className="pt-1 first:pt-0 flex items-center justify-between text-[9px]">
                    <div>
                      <span className="font-black text-slate-800">
                        {inst.installmentNumber}x {inst.paymentMethod?.name || "Pagamento"}
                      </span>
                      <span className="text-[8px] text-slate-500 ml-1.5">
                        (Vencimento: {formatDate(inst.dueDate)})
                      </span>
                    </div>
                    <span className="font-black text-slate-900">{formatBRL(inst.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] font-bold text-slate-700">Pagamento integral à vista / na entrega.</p>
            )}
          </div>
        </div>

        {/* CANHOTO / TERMO DE RECEBIMENTO DO CLIENTE */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-400">
          <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-slate-400 mb-1">
            <span>✂ DESTACAR NO ATO DA ENTREGA</span>
            <span>PROTOCOLO DE RECEBIMENTO</span>
          </div>

          <p className="text-[8px] text-slate-600 leading-tight mb-4">
            Declaro que recebi os produtos constantes neste pedido em perfeito estado de conservação,
            conforme as especificações e personalizações acordadas.
          </p>

          <div className="grid grid-cols-2 gap-4 items-end pt-2">
            <div className="border-t border-slate-900 pt-1 text-center">
              <span className="text-[8px] font-bold uppercase text-slate-800 block">
                {order.recipientName || customer?.fullName || "Assinatura do Recebedor"}
              </span>
              <span className="text-[7px] text-slate-400">Assinatura do Cliente / Recebedor</span>
            </div>
            <div className="border-t border-slate-900 pt-1 text-center">
              <span className="text-[8px] font-bold text-slate-800 block">
                ____ / ____ / 2026
              </span>
              <span className="text-[7px] text-slate-400">Data de Recebimento</span>
            </div>
          </div>

          <div className="text-center mt-3 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
            {companyInfo.name} • DOCUMENTO NÃO FISCAL DE CONTROLE E PRODUÇÃO
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="order-print-container">
      {renderSingleSlip(copies === 2 ? "1ª VIA: CLIENTE / EXPEDIÇÃO" : "VIA ÚNICA", 1)}
      {copies === 2 && renderSingleSlip("2ª VIA: FÁBRICA / PRODUÇÃO", 2)}
    </div>
  );
}
