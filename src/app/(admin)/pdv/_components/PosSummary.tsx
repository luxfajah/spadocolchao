"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  QrCode,
  Trash2,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { usePos } from "./PosContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    payments,
    setPayments,
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
  } = usePos();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);


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

        {/* AGENDAMENTO DE LOGÍSTICA: RETIRADA E ENTREGA (ANTES DO PAGAMENTO) */}
        <div className="rounded-[1.75rem] border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-blue-100/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-[#02213f] text-white shadow-md shadow-blue-950/20">
                <Truck className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                  Agendamento Obrigatório
                </span>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  Data de Retirada & Entrega
                </h3>
              </div>
            </div>

            {/* Seletor de Modalidade */}
            <div className="inline-flex rounded-2xl bg-slate-100 p-1 text-[11px] font-black">
              <button
                type="button"
                onClick={() => setScheduleMode("both")}
                className={`rounded-xl px-3.5 py-1.5 transition-all ${
                  scheduleMode === "both"
                    ? "bg-[#02213f] text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Retirada & Entrega
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("delivery")}
                className={`rounded-xl px-3.5 py-1.5 transition-all ${
                  scheduleMode === "delivery"
                    ? "bg-[#02213f] text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Apenas Entrega
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode("pickup")}
                className={`rounded-xl px-3.5 py-1.5 transition-all ${
                  scheduleMode === "pickup"
                    ? "bg-[#02213f] text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Apenas Retirada
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Bloco Retirada Agendada */}
            {(scheduleMode === "both" || scheduleMode === "pickup") && (
              <div className="rounded-[1.4rem] border border-amber-200/80 bg-amber-50/50 p-4 transition-all">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-700" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Retirada Agendada
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-200/60 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900">
                    {scheduleMode === "pickup" ? "Retirada pelo Cliente" : "Coleta de Reforma"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Data da Retirada
                    </label>
                    <Input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="h-11 rounded-xl border-amber-200 bg-white text-xs font-black text-slate-900 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Horário / Turno
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm outline-none"
                    >
                      <option value="">Selecione o turno</option>
                      <option value="09:00">Manhã (08h às 12h)</option>
                      <option value="14:00">Tarde (13h às 18h)</option>
                      <option value="10:00">Horário Comercial</option>
                      <option value="18:00">Fim de Tarde (após 17h)</option>
                    </select>
                  </div>
                </div>

                {/* Atalhos de data rápida para retirada */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400">Atalhos:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setPickupDate(d.toISOString().split("T")[0]);
                    }}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-amber-100/70"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      setPickupDate(d.toISOString().split("T")[0]);
                    }}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-amber-100/70"
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      setPickupDate(d.toISOString().split("T")[0]);
                    }}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-amber-100/70"
                  >
                    +3 dias
                  </button>
                </div>
              </div>
            )}

            {/* Bloco Entrega Agendada */}
            {(scheduleMode === "both" || scheduleMode === "delivery") && (
              <div className="rounded-[1.4rem] border border-emerald-200/80 bg-emerald-50/50 p-4 transition-all">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      Entrega Agendada
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-200/60 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-900">
                    Entrega no Endereço
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Data da Entrega
                    </label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="h-11 rounded-xl border-emerald-200 bg-white text-xs font-black text-slate-900 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Horário / Turno
                    </label>
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm outline-none"
                    >
                      <option value="">Selecione o turno</option>
                      <option value="09:00">Manhã (08h às 12h)</option>
                      <option value="14:00">Tarde (13h às 18h)</option>
                      <option value="10:00">Horário Comercial</option>
                      <option value="18:00">Fim de Tarde (após 17h)</option>
                    </select>
                  </div>
                </div>

                {/* Atalhos de data rápida para entrega */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400">Prazos de fábrica:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 5);
                      setDeliveryDate(d.toISOString().split("T")[0]);
                    }}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-emerald-100/70"
                  >
                    +5 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
                      setDeliveryDate(d.toISOString().split("T")[0]);
                    }}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-emerald-100/70"
                  >
                    +7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 10);
                      setDeliveryDate(d.toISOString().split("T")[0]);
                    }}
                    className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs hover:bg-emerald-100/70"
                  >
                    +10 dias (padrão)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dados opcionais do recebedor e observações */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Nome do Recebedor no Local
                </label>
                {customer?.fullName && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientName(customer.fullName);
                      if ((customer as any).phone) setRecipientPhone((customer as any).phone);
                    }}
                    className="text-[9px] font-bold text-blue-600 hover:underline"
                  >
                    Usar dados do cliente
                  </button>
                )}
              </div>
              <Input
                placeholder={customer?.fullName || "Quem irá receber os produtos?"}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Telefone de Contato para Entrega
              </label>
              <Input
                placeholder="(00) 00000-0000"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Instruções de Logística / Rota para o Motorista
              </label>
              <Input
                placeholder="Ex: Apartamento 42, Bloco C, interfone com defeito, ligar 20 min antes de chegar"
                value={logisticsNotes}
                onChange={(e) => setLogisticsNotes(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold"
              />
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

    </Card>
  );
}
