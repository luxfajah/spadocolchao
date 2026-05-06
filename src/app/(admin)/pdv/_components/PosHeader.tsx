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
    <div className="relative overflow-hidden rounded-[2.35rem] bg-[linear-gradient(135deg,#02213f_0%,#0b3156_42%,#14507e_100%)] px-6 py-4 text-white shadow-[0_20px_50px_-12px_rgba(0,34,66,0.6)]">
      {/* Background decoration */}
      <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-sky-400/5 blur-3xl" />

      <div className="relative flex items-center justify-between gap-8">
        {/* Logo and Status */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <Store className="h-6 w-6 text-sky-300" />
          </div>
          <div>
            <h2 className="font-outfit text-xl font-black uppercase tracking-tight">PDV Spa do Colchão</h2>
            <div className="mt-1 flex items-center gap-2">
               <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Caixa Aberto</span>
            </div>
          </div>
        </div>

        {/* Stepper */}
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
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Venda Atual</p>
              <p className="font-outfit text-xl font-black text-sky-300">{formatBRL(total)}</p>
            </div>
            {remaining > 0 && currentStep === 3 && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60">Faltante</p>
                <p className="font-outfit text-xl font-black text-amber-400">{formatBRL(remaining)}</p>
              </div>
            )}
          </div>

          <Link href="/vendas-clientes/pedidos">
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
