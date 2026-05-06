"use client";

import { CheckCircle2, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePos } from "./PosContext";
import { finalizeSale } from "../actions";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PosFloatingActions() {
  const {
    customer,
    sellerId,
    leadSourceId,
    initialData,
    items,
    subtotal,
    globalDiscount,
    total,
    payments,
    setPayments,
    resetSale,
    leadSourceDetail,
    campaignName,
    referralName,
    externalSellerName,
  } = usePos();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(total - totalPaid, 0);

  const handleFinalize = async () => {
    if (!customer?.id) return alert("Selecione um cliente");
    if (!leadSourceId) return alert("Selecione a origem da venda");
    if (items.length === 0) return alert("Adicione produtos a venda");

    if (remaining > 0.05) {
      return alert("O pagamento ainda não foi concluído. Faltam " + formatBRL(remaining));
    }

    if (!deliveryDate) {
      setShowDeliveryModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: customer.id,
        sellerId,
        leadSourceId,
        sessionId: initialData?.session?.id,
        items,
        subtotal,
        globalDiscount,
        total,
        payments,
        deliveryDate: `${deliveryDate}T${deliveryTime || "00:00"}:00`,
        recipientName,
        recipientPhone,
        leadSourceDetail,
        campaignName,
        referralName,
        externalSellerName,
      };

      const result = await finalizeSale(payload);

      if (result?.success && (result as any).result?.orderId) {
        window.open(`/pdv/receipt/${(result as any).result.orderId}`, "_blank");
        resetSale();
        setPayments([]);
        setDeliveryDate("");
        setRecipientName("");
        setRecipientPhone("");
        setShowDeliveryModal(false);
      } else {
        alert("Erro: " + result?.error);
      }
    } catch (_error) {
      alert("Ocorreu um erro fatal ao gerar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 z-50 flex w-[95%] -translate-x-1/2 items-center gap-4 lg:bottom-10 lg:w-[calc(82%-4rem)] lg:left-[56.5%]">
        {/* Barra de Subtotal */}
        <div className="flex flex-1 items-center justify-between rounded-[1.8rem] bg-[#02213f] px-6 py-4 text-white shadow-[0_20px_50px_-12px_rgba(0,34,66,0.5)] backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="h-5 w-5 text-sky-300" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Subtotal do carrinho</p>
              <p className="text-xs font-bold text-sky-100/80">Pronto para seguir ao fechamento</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 sm:hidden">Subtotal</p>
             <p className="font-outfit text-2xl font-black tracking-tight lg:text-3xl">{formatBRL(subtotal)}</p>
          </div>
        </div>

        {/* Botão Finalizar */}
        <div className="flex shrink-0 flex-col gap-2">
            {remaining <= 0.05 ? (
                 <div className="hidden items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 backdrop-blur-md lg:flex">
                    <CheckCircle2 className="h-3 w-3" />
                    Pagamento pronto
                 </div>
            ) : (
                <div className="hidden items-center justify-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-amber-500 backdrop-blur-md lg:flex">
                    Faltam {formatBRL(remaining)}
                </div>
            )}
            
            <Button
                onClick={handleFinalize}
                disabled={isSubmitting || (remaining > 0.05 && items.length > 0)}
                className="h-16 rounded-[1.8rem] bg-[#02213f] px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_-12px_rgba(0,34,66,0.5)] hover:bg-slate-900 border border-white/10"
            >
                {isSubmitting ? "Processando..." : "Finalizar pedido"}
            </Button>
        </div>
      </div>

      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="overflow-hidden rounded-[2.2rem] border-none p-0 sm:max-w-[520px]">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 p-8">
            <DialogTitle className="text-2xl font-black tracking-tight text-primary">Dados de entrega</DialogTitle>
          </DialogHeader>

          <div className="space-y-8 p-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Data de entrega
                </label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="h-12 rounded-[1.2rem] border-slate-200 bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Horario aproximado
                </label>
                <Input
                  type="time"
                  value={deliveryTime}
                  onChange={(event) => setDeliveryTime(event.target.value)}
                  className="h-12 rounded-[1.2rem] border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-5 rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Recebedor alternativo (opcional)
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Nome do recebedor
                </label>
                <Input
                  placeholder="Quem vai receber o produto?"
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  className="h-12 rounded-[1.2rem] border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Telefone de contato
                </label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                  className="h-12 rounded-[1.2rem] border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50/80 p-8 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeliveryModal(false)}
              className="h-12 rounded-full px-6 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleFinalize}
              disabled={!deliveryDate || isSubmitting}
              className="h-12 rounded-full bg-primary px-6 text-[10px] font-black uppercase tracking-[0.22em] text-white hover:bg-slate-900"
            >
              {isSubmitting ? "Finalizando..." : "Confirmar e gerar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
