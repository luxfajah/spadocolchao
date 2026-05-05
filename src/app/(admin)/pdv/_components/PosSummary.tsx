"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  DollarSign,
  QrCode,
  Trash2,
  Wallet,
} from "lucide-react";
import { usePos } from "./PosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { finalizeSale } from "../actions";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PaymentEntry = {
  id: string;
  methodId: string;
  name: string;
  amount: number;
  installments: number;
  isBoleto: boolean;
};

type PaymentKind = "dinheiro" | "debito" | "pix" | "credito" | "boleto";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const paymentOptions: Array<{
  key: PaymentKind;
  name: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
}> = [
  {
    key: "dinheiro",
    name: "Dinheiro",
    description: "Recebimento fisico em caixa",
    icon: DollarSign,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "pix",
    name: "PIX",
    description: "Transferencia instantanea",
    icon: QrCode,
    iconClassName: "bg-teal-50 text-teal-600",
  },
  {
    key: "debito",
    name: "Debito",
    description: "Cartao de pagamento imediato",
    icon: CreditCard,
    iconClassName: "bg-sky-50 text-sky-600",
  },
  {
    key: "credito",
    name: "Credito",
    description: "Parcelamento no cartao",
    icon: Wallet,
    iconClassName: "bg-orange-50 text-orange-600",
  },
  {
    key: "boleto",
    name: "Boleto parcelado",
    description: "Fluxo para empresas e prazos futuros",
    icon: Building2,
    iconClassName: "bg-violet-50 text-violet-600",
  },
];

export function PosSummary() {
  const {
    initialData,
    customer,
    sellerId,
    leadSourceId,
    items,
    subtotal,
    globalDiscount,
    total,
    setGlobalDiscount,
    resetSale,
    leadSourceDetail,
    campaignName,
    referralName,
    externalSellerName,
  } = usePos();

  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [activeMethod, setActiveMethod] = useState<{
    id: string;
    name: string;
    isCredit: boolean;
    isBoleto: boolean;
  } | null>(null);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [currentInstallments, setCurrentInstallments] = useState<number>(1);

  const totalPaid = payments.reduce((accumulator, payment) => accumulator + payment.amount, 0);
  const remaining = Math.max(total - totalPaid, 0);
  const paymentProgress = total > 0 ? Math.min((totalPaid / total) * 100, 100) : 0;
  const statusLabel =
    items.length === 0 ? "Sem itens" : remaining > 0.05 ? "Pagamento pendente" : "Pronto para finalizar";
  const statusHint =
    items.length === 0
      ? "Adicione produtos no catalogo"
      : remaining > 0.05
        ? `${payments.length} pagamento(s) confirmado(s)`
        : "Tudo pronto para gerar o pedido";

  const getMethodId = (query: string) => {
    const paymentMethod = initialData?.paymentMethods?.find((method: any) =>
      method.name.toLowerCase().includes(query.toLowerCase())
    );

    return paymentMethod?.id || (initialData?.paymentMethods?.[0]?.id || "default");
  };

  const openPaymentModal = (type: PaymentKind) => {
    if (remaining <= 0) return alert("O valor total ja foi atingido.");

    let methodConfig = { id: "", name: "", isCredit: false, isBoleto: false };

    switch (type) {
      case "dinheiro":
        methodConfig = { id: getMethodId("dinheiro"), name: "Dinheiro", isCredit: false, isBoleto: false };
        break;
      case "debito":
        methodConfig = {
          id: getMethodId("débito") || getMethodId("debito"),
          name: "Debito",
          isCredit: false,
          isBoleto: false,
        };
        break;
      case "pix":
        methodConfig = { id: getMethodId("pix"), name: "PIX", isCredit: false, isBoleto: false };
        break;
      case "credito":
        methodConfig = {
          id: getMethodId("crédito") || getMethodId("credito"),
          name: "Cartao de credito",
          isCredit: true,
          isBoleto: false,
        };
        break;
      case "boleto":
        methodConfig = {
          id: getMethodId("boleto"),
          name: "Boleto parcelado (empresas)",
          isCredit: false,
          isBoleto: true,
        };
        break;
    }

    setActiveMethod(methodConfig);
    setCurrentAmount(remaining);
    setCurrentInstallments(1);
  };

  const confirmPayment = () => {
    if (!activeMethod) return;

    if (currentAmount <= 0) {
      alert("O valor pago deve ser maior que zero.");
      return;
    }

    if (currentAmount > remaining + 0.05) {
      alert(`O valor maximo restante e ${formatBRL(remaining)}`);
      return;
    }

    const newPayment: PaymentEntry = {
      id: Math.random().toString(),
      methodId: activeMethod.id,
      name: activeMethod.name,
      amount: currentAmount,
      installments: currentInstallments,
      isBoleto: activeMethod.isBoleto,
    };

    setPayments([...payments, newPayment]);
    setActiveMethod(null);
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter((payment) => payment.id !== id));
  };

  const handleFinalize = async () => {
    if (!customer?.id) return alert("Selecione um cliente");
    if (!leadSourceId) return alert("Selecione a origem da venda");
    if (items.length === 0) return alert("Adicione produtos a venda");

    if (remaining > 0.01) {
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

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-lahomes backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-primary text-white shadow-lg shadow-primary/15">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Fechamento</p>
                <CardTitle className="text-2xl font-black tracking-tight text-primary">
                  Pagamento e checkout
                </CardTitle>
              </div>
            </div>

            <div className="rounded-full bg-primary/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              {payments.length} pagamento(s)
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total pago</p>
              <p className="mt-2 font-outfit text-2xl font-black tracking-tight text-primary">
                {formatBRL(totalPaid)}
              </p>
              <p className="mt-2 text-xs text-slate-500">Soma dos pagamentos confirmados</p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Restante</p>
              <p
                className={`mt-2 font-outfit text-2xl font-black tracking-tight ${
                  remaining > 0.05 ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {formatBRL(remaining)}
              </p>
              <p className="mt-2 text-xs text-slate-500">Valor que falta para concluir a venda</p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-2 text-sm font-black text-primary">{statusLabel}</p>
              <p className="mt-2 text-xs text-slate-500">{statusHint}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="custom-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-6">
        <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subtotal</span>
              <span className="font-outfit text-lg font-black text-primary">{formatBRL(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Desconto</label>
              <Input
                type="number"
                value={globalDiscount || ""}
                onChange={(event) => setGlobalDiscount(Number(event.target.value) || 0)}
                placeholder="0,00"
                className="h-11 w-32 rounded-full border-slate-200 bg-white px-4 text-right text-sm font-black text-primary"
              />
            </div>

            <div className="rounded-[1.4rem] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total final</p>
                  <p className="mt-1 font-outfit text-3xl font-black tracking-tight text-primary">
                    {formatBRL(total)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Andamento</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{paymentProgress.toFixed(0)}% pago</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Metodos de pagamento</p>
            <p className="text-xs font-semibold text-slate-500">Distribua o valor da forma mais conveniente</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {paymentOptions.map((option) => (
              <Button
                key={option.key}
                type="button"
                variant="ghost"
                onClick={() => openPaymentModal(option.key)}
                className={`h-auto justify-start rounded-[1.4rem] border border-slate-100 bg-white px-4 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white ${
                  option.key === "boleto" ? "sm:col-span-2" : ""
                }`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-[1rem] ${option.iconClassName}`}>
                  <option.icon className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-black text-primary">{option.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{option.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {payments.length > 0 && (
          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                Pagamentos confirmados
              </p>
              <p className="text-xs font-semibold text-slate-500">{payments.length} registro(s)</p>
            </div>

            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-[1.2rem] border border-slate-100 bg-slate-50/70 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-black text-primary">{payment.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {payment.installments > 1 ? `${payment.installments} parcela(s)` : "Pagamento unico"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="font-outfit text-lg font-black text-primary">{formatBRL(payment.amount)}</p>
                    <button
                      type="button"
                      onClick={() => removePayment(payment.id)}
                      className="rounded-full p-2 text-rose-500 transition-colors hover:bg-rose-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm">
          {remaining > 0.05 && items.length > 0 ? (
            <div className="mb-4 rounded-[1.2rem] border border-amber-100 bg-amber-50 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
              Faltam {formatBRL(remaining)} para concluir.
            </div>
          ) : items.length > 0 ? (
            <div className="mb-4 flex items-center justify-center gap-2 rounded-[1.2rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Pagamento pronto para finalizar
            </div>
          ) : null}

          <Button
            type="button"
            onClick={handleFinalize}
            disabled={isSubmitting || Math.abs(remaining) > 0.05 || items.length === 0}
            className="h-14 w-full rounded-full bg-primary text-[11px] font-black uppercase tracking-[0.24em] text-white shadow-xl shadow-primary/20 transition-all hover:bg-slate-900 disabled:opacity-40"
          >
            {isSubmitting ? "Processando..." : items.length === 0 ? "Carrinho vazio" : "Finalizar pedido"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={!!activeMethod} onOpenChange={(open) => !open && setActiveMethod(null)}>
        <DialogContent className="overflow-hidden rounded-[2rem] border-none p-0 sm:max-w-md">
          <DialogHeader className="border-b border-slate-100 bg-slate-50/80 p-6">
            <DialogTitle className="text-xl font-black text-primary">
              Pagamento via {activeMethod?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={currentAmount}
                onChange={(event) => setCurrentAmount(Number(event.target.value))}
                className="h-12 text-lg font-black"
              />
              <p className="text-xs text-slate-500">O valor restante da venda e {formatBRL(remaining)}.</p>
            </div>

            {activeMethod?.isCredit && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Parcelamento do cartao</label>
                <select
                  value={currentInstallments}
                  onChange={(event) => setCurrentInstallments(Number(event.target.value))}
                  className="flex h-12 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none"
                >
                  <option value="1">A vista (1x)</option>
                  <option value="2">2x sem juros</option>
                  <option value="3">3x sem juros</option>
                  <option value="4">4x sem juros</option>
                </select>
              </div>
            )}

            {activeMethod?.isBoleto && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Prazos do boleto</label>
                <select
                  value={currentInstallments}
                  onChange={(event) => setCurrentInstallments(Number(event.target.value))}
                  className="flex h-12 w-full rounded-[1rem] border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none"
                >
                  <option value="1">30 dias</option>
                  <option value="2">30 / 60 dias</option>
                  <option value="3">30 / 60 / 90 dias</option>
                  <option value="4">30 / 60 / 90 / 120 dias</option>
                </select>
                <p className="text-xs text-slate-500">
                  Isso vai gerar as parcelas futuras em Contas a Receber.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 bg-slate-50/80 p-6 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setActiveMethod(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmPayment} className="bg-primary text-white hover:bg-slate-900">
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </Card>
  );
}
