"use client";

import { PosHeader } from "./PosHeader";
import { PosCustomer } from "./PosCustomer";
import { PosCatalog } from "./PosCatalog";
import { PosCart } from "./PosCart";
import { PosSummary } from "./PosSummary";
import { PosProvider } from "./PosContext";
import { PosFloatingActions } from "./PosFloatingActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, LayoutDashboard, Users } from "lucide-react";

export function PosLayout({ initialData }: { initialData?: any }) {
  return (
    <PosProvider initialData={initialData}>
      <div className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col gap-5 overflow-hidden rounded-[2.75rem] border border-white/70 bg-[linear-gradient(180deg,#f9fbff_0%,#eef4fb_55%,#f8fafc_100%)] p-3 pt-24 pb-32 shadow-[0_35px_80px_-35px_rgba(0,34,66,0.35)] sm:p-4 sm:pt-24 lg:p-5 lg:pt-5 lg:pb-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_42%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_36%)]" />

        <div className="relative flex min-h-0 flex-1 flex-col gap-5">
          <PosHeader />

          <div className="hidden min-h-0 flex-1 gap-5 lg:grid lg:grid-cols-[280px_minmax(0,1.2fr)_340px] xl:grid-cols-[340px_minmax(0,1.35fr)_400px]">
            <div className="min-h-0">
              <PosCustomer />
            </div>

            <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(280px,0.72fr)] gap-5">
              <PosCatalog />
              <PosCart />
            </div>

            <div className="min-h-0">
              <PosSummary />
            </div>
          </div>

          <div className="min-h-0 flex-1 lg:hidden">
            <Tabs defaultValue="catalog" className="flex h-full min-h-0 flex-col gap-4">
              <TabsList className="grid h-auto grid-cols-3 gap-1 rounded-[1.6rem] border border-white/70 bg-white/80 p-1.5 text-slate-500 shadow-lahomes backdrop-blur">
                <TabsTrigger
                  value="catalog"
                  className="h-14 gap-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.18em] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Catalogo
                </TabsTrigger>
                <TabsTrigger
                  value="cart"
                  className="h-14 gap-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.18em] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Users className="h-4 w-4" />
                  Atendimento
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="h-14 gap-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.18em] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <CreditCard className="h-4 w-4" />
                  Fechamento
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="mt-0 min-h-0 flex-1 data-[state=active]:flex">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <PosCatalog />
                </div>
              </TabsContent>

              <TabsContent value="cart" className="mt-0 min-h-0 flex-1 data-[state=active]:flex">
                <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-1">
                  <div className="shrink-0">
                    <PosCustomer />
                  </div>
                  <div className="min-h-[24rem] shrink-0">
                    <PosCart />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="summary" className="mt-0 min-h-0 flex-1 data-[state=active]:flex">
                <div className="min-h-0 flex-1 overflow-hidden">
                  <PosSummary />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <PosFloatingActions />
    </PosProvider>
  );
}
