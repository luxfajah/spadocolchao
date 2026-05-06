"use client";

import { Edit2, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePos } from "./PosContext";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PosCart() {
  const { items, removeItem, subtotal } = usePos();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-lahomes backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100/80 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-primary text-white shadow-lg shadow-primary/15">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Carrinho</p>
            <h3 className="text-2xl font-black tracking-tight text-primary">Itens selecionados</h3>
          </div>
        </div>

        <div className="text-right">
          <div className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {items.length} itens
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">Subtotal atual {formatBRL(subtotal)}</p>
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
              Selecione um produto no catalogo para montar a venda e fechar o pedido com mais rapidez.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="group flex items-center gap-4 rounded-[1.6rem] border border-slate-100 bg-slate-50/70 px-4 py-4 transition-all hover:border-slate-200 hover:bg-white"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white text-sm font-black text-primary shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-black leading-tight text-primary">{item.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <span className="rounded-full bg-white px-2.5 py-1 text-primary/80">{item.type}</span>
                    <span>
                      {item.quantity} un x {formatBRL(item.unitPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <p className="font-outfit text-lg font-black text-primary">{formatBRL(item.totalAmount)}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary"
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
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
