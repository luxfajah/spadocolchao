"use client";

import { PosHeader } from "./PosHeader";
import { PosCustomer } from "./PosCustomer";
import { PosCatalog } from "./PosCatalog";
import { PosCart } from "./PosCart";
import { PosSummary } from "./PosSummary";
import { PosProvider, usePos } from "./PosContext";
import { PosFloatingActions } from "./PosFloatingActions";
import { useState } from "react";
import { ShoppingBag, Package2 } from "lucide-react";

function PosContent() {
  const { currentStep, items } = usePos();
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-3 overflow-hidden rounded-none lg:rounded-[2.75rem] border-0 lg:border lg:border-white/70 bg-[linear-gradient(180deg,#f9fbff_0%,#eef4fb_55%,#f8fafc_100%)] p-2 pt-3 pb-44 lg:p-6 lg:pb-32 shadow-none lg:shadow-[0_35px_80px_-35px_rgba(0,34,66,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_36%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col gap-0">
        <div className="sticky top-0 z-30 pb-3 lg:pb-6 bg-transparent">
          <PosHeader />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 pb-16">
          {/* ETAPA 1: CLIENTE E CONTEXTO */}
          {currentStep === 1 && (
            <div className="mx-auto max-w-5xl h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PosCustomer />
            </div>
          )}

          {/* ETAPA 2: PRODUTOS E CARRINHO */}
          {currentStep === 2 && (
            <>
              {/* Mobile: Abas switcher */}
              <div className="flex lg:hidden mb-3 rounded-2xl bg-white/80 border border-slate-200 p-1 gap-1 shadow-sm">
                <button
                  onClick={() => setMobileTab("catalog")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mobileTab === "catalog" ? "bg-primary text-white shadow" : "text-slate-500 hover:text-primary"}`}
                >
                  <Package2 className="h-3.5 w-3.5" />
                  Produtos
                </button>
                <button
                  onClick={() => setMobileTab("cart")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${mobileTab === "cart" ? "bg-primary text-white shadow" : "text-slate-500 hover:text-primary"}`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Carrinho
                  {items.length > 0 && (
                    <span className="bg-sky-500 text-white rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                      {items.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile: conteúdo da aba ativa */}
              <div className="block lg:hidden animate-in fade-in duration-300">
                {mobileTab === "catalog" && <PosCatalog />}
                {mobileTab === "cart" && <PosCart />}
              </div>

              {/* Desktop: Grid lado a lado */}
              <div className="hidden lg:grid h-full gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="min-h-0"><PosCatalog /></div>
                <div className="min-h-0"><PosCart /></div>
              </div>
            </>
          )}

          {/* ETAPA 3: PAGAMENTO E CHECKOUT */}
          {currentStep === 3 && (
            <div className="mx-auto max-w-6xl h-full animate-in fade-in slide-in-from-right-4 duration-500">
              <PosSummary />
            </div>
          )}
        </div>
      </div>
      <PosFloatingActions />
    </div>
  );
}

export function PosLayout({ initialData }: { initialData?: any }) {
  return (
    <PosProvider initialData={initialData}>
      <PosContent />
    </PosProvider>
  );
}
