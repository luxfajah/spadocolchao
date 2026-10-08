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
    currentStep,
    setCurrentStep,
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
    pickupDate,
    setPickupDate,
    pickupTime,
    setPickupTime,
    deliveryDate,
    setDeliveryDate,
    deliveryTime,
    setDeliveryTime,
    recipientName,
    setRecipientName,
    recipientPhone,
    setRecipientPhone,
    logisticsNotes,
    setLogisticsNotes,
    scheduleMode,
    setScheduleMode,
    freightAmount,
    hasDownPayment,
    downPaymentAmount,
    downPaymentMethod,
  } = usePos();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(total - totalPaid, 0);

  const isPaymentSatisfied = hasDownPayment && downPaymentAmount > 0
    ? totalPaid >= downPaymentAmount - 0.05
    : remaining <= 0.05;

  const canGoNext = () => {
    if (currentStep === 1) return !!customer?.id && (!!sellerId || !!initialData?.currentSellerId);
    if (currentStep === 2) return items.length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!customer?.id) return alert("Por favor, selecione um cliente.");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (items.length === 0) return alert("O carrinho está vazio.");
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinalize = async () => {
    if (!customer?.id) return alert("Selecione um cliente");
    if (!leadSourceId) return alert("Selecione a origem da venda");
    if (items.length === 0) return alert("Adicione produtos a venda");

    if (hasDownPayment && downPaymentAmount > 0) {
      if (totalPaid < downPaymentAmount - 0.05) {
        return alert(
          `Você definiu uma entrada no ato de ${formatBRL(downPaymentAmount)}, mas o valor pago até agora é de ${formatBRL(totalPaid)}. Registre o pagamento da entrada para concluir.`
        );
      }
    } else {
      if (remaining > 0.05) {
        return alert("O pagamento ainda não foi concluído. Faltam " + formatBRL(remaining));
      }
    }

    if (!deliveryDate && !pickupDate) {
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
        freightAmount: freightAmount || 0,
        surchargeAmount: freightAmount || 0,
        hasDownPayment,
        downPaymentAmount: hasDownPayment ? downPaymentAmount : 0,
        downPaymentMethod: hasDownPayment ? downPaymentMethod : null,
        payments,
        deliveryDate: deliveryDate ? `${deliveryDate}T${deliveryTime || "00:00"}:00` : null,
        pickupDate: pickupDate ? `${pickupDate}T${pickupTime || "00:00"}:00` : null,
        recipientName: recipientName || customer.fullName,
        recipientPhone: recipientPhone || (customer as any)?.phone || "",
        logisticsNotes,
        leadSourceDetail,
        campaignName,
        referralName,
        externalSellerName,
      };

      const result = await finalizeSale(payload);

      if (result?.success && (result as any).result?.orderId) {
        window.open(`/pdv/impressao?orderId=${(result as any).result.orderId}`, "_blank");
        resetSale();
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

  // Não mostrar barra se não houver contexto iniciado (opcional)
  // if (currentStep === 1 && !customer) return null;

  return (
    <>
      <div className="fixed bottom-20 lg:bottom-10 left-1/2 z-50 flex w-[95%] -translate-x-1/2 items-center gap-2 lg:gap-4 lg:w-[calc(82%-4rem)] lg:left-[56.5%]">
        
        {/* Botão Voltar (aparece a partir do passo 2) */}
        {currentStep > 1 && (
          <Button
            onClick={handleBack}
            variant="ghost"
            className="h-12 lg:h-16 shrink-0 rounded-2xl lg:rounded-[1.8rem] bg-white/80 px-5 lg:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-xl backdrop-blur-md border border-white/50 hover:bg-white"
          >
            Voltar
          </Button>
        )}

        {/* Barra de Subtotal */}
        <div className="flex flex-1 items-center justify-between rounded-[1.8rem] bg-[#02213f] px-6 py-4 text-white shadow-[0_20px_50px_-12px_rgba(0,34,66,0.5)] backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="h-5 w-5 text-sky-300" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Venda em andamento</p>
              <p className="text-xs font-bold text-sky-100/80">
                {currentStep === 1 ? "Identificação" : currentStep === 2 ? "Montagem do Carrinho" : "Fechamento"}
              </p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 sm:hidden">Total</p>
             <p className="font-outfit text-2xl font-black tracking-tight lg:text-3xl">{formatBRL(total)}</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex shrink-0 items-center gap-3">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="h-12 lg:h-16 rounded-2xl lg:rounded-[1.8rem] bg-sky-500 px-5 lg:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_-12px_rgba(14,165,233,0.5)] hover:bg-sky-600 border border-white/20 disabled:opacity-50"
              >
                {currentStep === 1 ? "Próximo" : "Pagamento"}
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                {isPaymentSatisfied ? (
                    <div className="hidden items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 backdrop-blur-md lg:flex">
                        <CheckCircle2 className="h-3 w-3" />
                        {hasDownPayment && downPaymentAmount > 0 ? "Entrada Paga • Saldo na Entrega" : "Pronto para Gerar Pedido"}
                    </div>
                ) : (
                    <div className="hidden items-center justify-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-amber-500 backdrop-blur-md lg:flex">
                        {hasDownPayment && downPaymentAmount > 0
                          ? `Falta Entrada: ${formatBRL(Math.max(0, downPaymentAmount - totalPaid))}`
                          : `Faltam ${formatBRL(remaining)}`}
                    </div>
                )}
                <Button
                    onClick={handleFinalize}
                    disabled={isSubmitting || (!isPaymentSatisfied && items.length > 0)}
                    className="h-12 lg:h-16 rounded-2xl lg:rounded-[1.8rem] bg-[#02213f] px-5 lg:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_-12px_rgba(0,34,66,0.5)] hover:bg-slate-900 border border-white/10"
                >
                    {isSubmitting ? "Processando..." : "Finalizar"}
                </Button>
              </div>
            )}
        </div>
      </div>

      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="overflow-hidden rounded-[2.2rem] border-none p-0 sm:max-w-[560px]">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 p-6 sm:p-8">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-primary">
              Agendamento de Retirada & Entrega
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
            {/* Bloco Retirada */}
            <div className="rounded-[1.4rem] border border-amber-200/80 bg-amber-50/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900 mb-2.5">
                Data de Retirada Agendada (Opcional se produto novo)
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Data de Retirada</label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(event) => setPickupDate(event.target.value)}
                    className="h-11 rounded-[1rem] border-amber-200 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Turno da Retirada</label>
                  <select
                    value={pickupTime}
                    onChange={(event) => setPickupTime(event.target.value)}
                    className="flex h-11 w-full rounded-[1rem] border border-amber-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="09:00">Manhã (08h às 12h)</option>
                    <option value="14:00">Tarde (13h às 18h)</option>
                    <option value="10:00">Comercial</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco Entrega */}
            <div className="rounded-[1.4rem] border border-emerald-200/80 bg-emerald-50/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900 mb-2.5">
                Data de Entrega Agendada
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Data de Entrega</label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className="h-11 rounded-[1rem] border-emerald-200 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Turno da Entrega</label>
                  <select
                    value={deliveryTime}
                    onChange={(event) => setDeliveryTime(event.target.value)}
                    className="flex h-11 w-full rounded-[1rem] border border-emerald-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="">Selecione...</option>
                    <option value="09:00">Manhã (08h às 12h)</option>
                    <option value="14:00">Tarde (13h às 18h)</option>
                    <option value="10:00">Comercial</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.4rem] border border-slate-100 bg-slate-50/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Recebedor no Local e Contato
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Nome do recebedor
                  </label>
                  <Input
                    placeholder={customer?.fullName || "Quem vai receber o produto?"}
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    className="h-11 rounded-[1rem] border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Telefone de contato
                  </label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    className="h-11 rounded-[1rem] border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50/80 p-6 sm:justify-between">
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
              disabled={(!deliveryDate && !pickupDate) || isSubmitting}
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
