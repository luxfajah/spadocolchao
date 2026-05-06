"use client";

import { PosHeader } from "./PosHeader";
import { PosCustomer } from "./PosCustomer";
import { PosCatalog } from "./PosCatalog";
import { PosCart } from "./PosCart";
import { PosSummary } from "./PosSummary";
import { PosProvider, usePos } from "./PosContext";
import { PosFloatingActions } from "./PosFloatingActions";

function PosContent() {
  const { currentStep } = usePos();

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col gap-6 overflow-hidden rounded-[2.75rem] border border-white/70 bg-[linear-gradient(180deg,#f9fbff_0%,#eef4fb_55%,#f8fafc_100%)] p-4 pt-6 pb-32 shadow-[0_35px_80px_-35px_rgba(0,34,66,0.35)] lg:p-6 lg:pb-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_36%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col gap-0">
        <div className="sticky top-0 z-30 pb-6 bg-transparent">
          <PosHeader />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 pb-4">
          {/* ETAPA 1: CLIENTE E CONTEXTO */}
          {currentStep === 1 && (
            <div className="mx-auto max-w-5xl h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PosCustomer />
            </div>
          )}

          {/* ETAPA 2: PRODUTOS E CARRINHO */}
          {currentStep === 2 && (
            <div className="grid h-full gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="min-h-0">
                <PosCatalog />
              </div>
              <div className="min-h-0">
                <PosCart />
              </div>
            </div>
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
