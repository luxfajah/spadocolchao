"use client";

import { useState } from "react";
import { Edit2, ShoppingBag, Trash2, ShieldCheck, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePos, SaleItemType } from "./PosContext";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PosCart() {
  const { items, removeItem, updateItemPrice, subtotal } = usePos();
  
  // Estado do modal de alteração de preço integrada ao motor financeiro
  const [editingItem, setEditingItem] = useState<SaleItemType | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);
  const [justificationValue, setJustificationValue] = useState<string>("");

  const handleOpenEditPrice = (item: SaleItemType) => {
    setEditingItem(item);
    setEditPriceValue(item.unitPrice);
    setJustificationValue(item.priceJustification || "");
  };

  const handleSavePrice = () => {
    if (!editingItem) return;
    updateItemPrice(editingItem.id, editPriceValue, justificationValue);
    setEditingItem(null);
  };

  // Verificação em relação ao preço mínimo calculado pelo motor financeiro
  const minPrice = editingItem?.minimumPrice || 0;
  const isBelowMinimum = minPrice > 0 && editPriceValue < minPrice;
  const discountFromOriginal = editingItem ? Math.max(0, editingItem.originalPrice - editPriceValue) : 0;
  const discountPercent = editingItem && editingItem.originalPrice > 0 
    ? (discountFromOriginal / editingItem.originalPrice) * 100 
    : 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl lg:rounded-[2rem] border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 p-3 sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/15">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Carrinho</p>
            <h3 className="text-base font-black tracking-tight text-primary">Itens</h3>
          </div>
        </div>

        <div className="text-right">
          <div className="rounded-full bg-primary/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatBRL(subtotal)}</p>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-black text-primary">Carrinho aguardando itens</h4>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Selecione um produto no catálogo para montar a venda com a precificação correta.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const hasDiscount = item.originalPrice > item.unitPrice;
              const hasJustification = !!item.priceJustification;

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-3 sm:px-4 sm:py-4 transition-all hover:border-slate-200 hover:bg-white"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-[1rem] bg-white text-xs sm:text-sm font-black text-primary shadow-sm">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="min-w-0 flex-1 sm:hidden">
                      <p className="text-sm font-black leading-tight text-primary line-clamp-1">{item.name}</p>
                      {item.details?.customizationSummary && (
                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                          {item.details.customizationSummary}
                        </p>
                      )}
                      {hasJustification && (
                        <p className="text-[10px] text-amber-600 font-medium line-clamp-1 mt-0.5">
                          Obs: {item.priceJustification}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 hidden sm:block">
                    <p className="text-base font-black leading-tight text-primary">{item.name}</p>
                    {item.details?.customizationSummary && (
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {item.details.customizationSummary}
                      </p>
                    )}
                    {hasJustification && (
                      <p className="mt-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                        Negociação: {item.priceJustification}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      <span className="rounded-full bg-white px-2.5 py-1 text-primary/80">{item.type}</span>
                      <span>
                        {item.quantity} un x {formatBRL(item.unitPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-emerald-600 font-bold">
                          (Desc: {formatBRL(item.originalPrice - item.unitPrice)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Elementos mobile: badge de tipo, qtde, total e ações */}
                  <div className="flex sm:hidden flex-col gap-2 w-full mt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span className="rounded-full bg-white px-2 py-1 text-primary/80 shadow-sm">{item.type}</span>
                        <span>{item.quantity} un x {formatBRL(item.unitPrice)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-1">
                      <div>
                        {hasDiscount && (
                          <span className="text-[10px] line-through text-slate-400 block">
                            {formatBRL(item.originalPrice * item.quantity)}
                          </span>
                        )}
                        <p className="font-outfit text-sm font-black text-primary">{formatBRL(item.totalAmount)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEditPrice(item)}
                          className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary"
                          title="Ajustar preço com validação do motor financeiro"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex shrink-0 flex-col items-end gap-2">
                    <div className="text-right">
                      {hasDiscount && (
                        <span className="text-xs line-through text-slate-400 block font-mono">
                          {formatBRL(item.originalPrice * item.quantity)}
                        </span>
                      )}
                      <p className="font-outfit text-lg font-black text-primary">{formatBRL(item.totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditPrice(item)}
                        className="h-9 w-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary"
                        title="Ajustar preço com validação do motor financeiro"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-9 w-9 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Ajuste de Preço com Proteção do Motor Financeiro */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold text-primary flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Negociação de Preço no PDV
              </DialogTitle>
              <p className="text-xs text-slate-500 line-clamp-1">
                {editingItem.name}
              </p>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Balizadores do Motor Financeiro */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preço Base Oficial</span>
                  <span className="text-sm font-bold font-mono text-primary block">
                    {formatBRL(editingItem.originalPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preço Mínimo Autorizado</span>
                  <span className="text-sm font-bold font-mono text-emerald-600 block">
                    {editingItem.minimumPrice ? formatBRL(editingItem.minimumPrice) : "Sem trava"}
                  </span>
                </div>
              </div>

              {/* Input de Novo Preço Unitário */}
              <div className="space-y-1.5">
                <Label htmlFor="newUnitPrice" className="text-xs font-semibold">
                  Novo Preço Unitário Praticado (R$)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    R$
                  </span>
                  <Input
                    id="newUnitPrice"
                    type="number"
                    step="0.01"
                    value={editPriceValue}
                    onChange={(e) => setEditPriceValue(parseFloat(e.target.value) || 0)}
                    className="pl-10 h-11 text-lg font-bold font-mono tracking-tight text-primary"
                  />
                </div>
                {discountFromOriginal > 0 && (
                  <span className="text-xs text-emerald-600 font-medium block">
                    Desconto de {formatBRL(discountFromOriginal)} ({discountPercent.toFixed(1)}%)
                  </span>
                )}
              </div>

              {/* Alertas Dinâmicos de Margem e Break-even */}
              {isBelowMinimum ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block">Abaixo do Custo Mínimo Operacional</strong>
                    O valor digitado está abaixo do limite mínimo de <strong>{formatBRL(minPrice)}</strong> calculado pelo setor financeiro. O preenchimento da justificativa é obrigatório.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Preço dentro da margem de segurança operacional do sistema.</span>
                </div>
              )}

              {/* Justificativa Comercial */}
              <div className="space-y-1.5">
                <Label htmlFor="priceJustification" className="text-xs font-semibold flex items-center justify-between">
                  <span>Justificativa da Negociação</span>
                  {isBelowMinimum && <span className="text-rose-600 text-[10px] font-bold">* Obrigatório</span>}
                </Label>
                <Textarea
                  id="priceJustification"
                  placeholder="Ex: Cliente fechou conjunto à vista em dinheiro, autorizado pela gerência..."
                  value={justificationValue}
                  onChange={(e) => setJustificationValue(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-10 text-xs">
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSavePrice}
                disabled={isBelowMinimum && !justificationValue.trim()}
                className="h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirmar Preço
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
