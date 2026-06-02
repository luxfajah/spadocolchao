"use client";

import { CheckCircle2, CreditCard, LogOut, ShoppingBag, Store, UserRound } from "lucide-react";
import { usePos } from "./PosContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PosHeader() {
  const { currentStep, setCurrentStep, items, subtotal, total, payments } = usePos();
  
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(total - totalPaid, 0);

  const steps = [
    { id: 1, label: "Cliente e Contexto", icon: UserRound },
    { id: 2, label: "Produtos e Carrinho", icon: ShoppingBag },
    { id: 3, label: "Pagamento e Checkout", icon: CreditCard },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl lg:rounded-[2.35rem] bg-[linear-gradient(135deg,#02213f_0%,#0b3156_42%,#14507e_100%)] px-4 py-3 lg:px-6 lg:py-4 text-white shadow-[0_20px_50px_-12px_rgba(0,34,66,0.6)]">
      {/* Background decoration */}
      <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-sky-400/5 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3 lg:gap-8">
        {/* Logo and Status */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          <div className="flex h-9 w-9 lg:h-12 lg:w-12 items-center justify-center rounded-xl lg:rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <Store className="h-4 w-4 lg:h-6 lg:w-6 text-sky-300" />
          </div>
          <div>
            <h2 className="font-outfit text-sm lg:text-xl font-black uppercase tracking-tight">PDV</h2>
            <div className="mt-0.5 flex items-center gap-1.5">
               <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80">Caixa Aberto</span>
            </div>
          </div>
        </div>

        {/* Stepper Mobile: só bolinhas */}
        <div className="flex lg:hidden items-center gap-1.5">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentStep(step.id)}
                disabled={step.id > currentStep && items.length === 0}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                  currentStep === step.id
                    ? "border-sky-400 bg-sky-400/20 text-sky-400"
                    : step.id < currentStep
                    ? "border-sky-300/40 bg-sky-300/10 text-sky-300"
                    : "border-white/10 bg-white/5 text-white/20"
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <step.icon className="h-3.5 w-3.5" />
                )}
              </button>
              {idx < steps.length - 1 && (
                <div className="h-px w-4 bg-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Stepper Desktop: completo */}
        <div className="hidden lg:flex flex-1 max-w-2xl justify-center items-center gap-2 px-8">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                disabled={step.id > currentStep && items.length === 0}
                className={`group relative flex items-center gap-3 transition-all ${
                  currentStep === step.id 
                    ? "text-white" 
                    : step.id < currentStep 
                      ? "text-sky-300/60" 
                      : "text-white/20"
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all ${
                  currentStep === step.id 
                    ? "border-sky-400 bg-sky-400/20 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" 
                    : step.id < currentStep
                      ? "border-sky-300/30 bg-sky-300/10 text-sky-300"
                      : "border-white/10 bg-white/5"
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="hidden xl:block text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest leading-none">Passo 0{step.id}</p>
                   <p className="mt-1 text-xs font-bold whitespace-nowrap">{step.label}</p>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div className="mx-4 h-px flex-1 bg-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats & Exit */}
        <div className="flex items-center gap-2 lg:gap-6">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Total</p>
            <p className="font-outfit text-base lg:text-xl font-black text-sky-300">{formatBRL(total)}</p>
          </div>

          {/* Botão Sair: só desktop */}
          <Link href="/vendas-clientes/pedidos" className="hidden lg:block">
            <Button 
              variant="destructive" 
              className="h-11 gap-2 rounded-2xl bg-rose-600 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-900/20 hover:bg-rose-700 hover:scale-105 transition-all border border-rose-500/30"
            >
              <LogOut className="h-4 w-4" />
              Sair do PDV
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
