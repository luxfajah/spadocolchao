"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, Trash2, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePos } from "./PosContext";

export function PosCustomer() {
  const {
    initialData,
    customer,
    setCustomer,
    sellerId,
    setSellerId,
    leadSourceId,
    setLeadSourceId,
    leadSourceDetail,
    setLeadSourceDetail,
    items,
    globalDiscount,
  } = usePos();

  const [searchTerm, setSearchTerm] = useState(customer?.fullName || "");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (customer) setSearchTerm(customer.fullName);
  }, [customer]);

  useEffect(() => {
    if (!leadSourceId && initialData?.leadSources?.length > 0) {
      const defaultSource = initialData.leadSources.find((leadSource: any) => leadSource.isDefaultPdv);
      if (defaultSource) {
        setLeadSourceId(defaultSource.id);
      }
    }
  }, [initialData, leadSourceId, setLeadSourceId]);

  const selectedLeadSource = useMemo(
    () => initialData?.leadSources?.find((leadSource: any) => leadSource.id === leadSourceId),
    [initialData, leadSourceId]
  );

  const selectedSeller = useMemo(
    () => initialData?.sellers?.find((seller: any) => seller.id === sellerId),
    [initialData, sellerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return [];

    return (initialData?.customers || []).filter(
      (currentCustomer: any) =>
        currentCustomer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (currentCustomer.document && currentCustomer.document.includes(searchTerm))
    );
  }, [initialData, searchTerm]);

  const goToNewCustomer = () => {
    localStorage.setItem("pdv_draft", JSON.stringify({ items, sellerId, leadSourceId, globalDiscount }));
    window.location.href = "/vendas-clientes/clientes/new?from=pdv";
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-lahomes backdrop-blur-sm">
      <div className="border-b border-slate-100/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-primary text-white shadow-lg shadow-primary/15">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Atendimento</p>
                <h3 className="text-2xl font-black tracking-tight text-primary">Cliente e contexto da venda</h3>
              </div>
            </div>

            <div
              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] ${
                customer ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              {customer ? "Cliente pronto" : "Aguardando cliente"}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cliente</p>
              <p className="mt-2 text-sm font-black leading-snug text-primary">
                {customer?.fullName ?? "Nenhum cliente selecionado"}
              </p>
              <p className="mt-2 text-xs text-slate-500">{customer?.document ?? "Busque por nome ou CPF"}</p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vendedor</p>
              <p className="mt-2 text-sm font-black leading-snug text-primary">
                {selectedSeller?.name ?? "Selecione o vendedor"}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {selectedSeller?.jobTitleName ?? "Defina quem conduz a venda"}
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Origem</p>
              <p className="mt-2 text-sm font-black leading-snug text-primary">
                {selectedLeadSource?.name ?? "Origem não selecionada"}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {selectedLeadSource?.requiresDetail ? "Solicita detalhe complementar" : "Fluxo padrão do PDV"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="space-y-6">
          <div className="relative space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Pesquisar cliente
            </label>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Nome ou CPF"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !customer) {
                    goToNewCustomer();
                  }
                }}
                className="h-12 rounded-[1.2rem] border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-primary shadow-inner focus-visible:ring-primary/15"
              />
            </div>

            {showResults && searchTerm.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-[120] mt-1 overflow-hidden rounded-[1.4rem] border border-slate-100 bg-white shadow-2xl">
                <div className="custom-scrollbar max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((currentCustomer: any) => (
                      <button
                        key={currentCustomer.id}
                        type="button"
                        onClick={() => {
                          setCustomer(currentCustomer);
                          setSearchTerm(currentCustomer.fullName);
                          setShowResults(false);
                        }}
                        className="flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50"
                      >
                        <span className="text-sm font-black text-primary">{currentCustomer.fullName}</span>
                        <span className="text-xs font-semibold text-slate-400">
                          {currentCustomer.document || "Sem CPF"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-5 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Nenhum cliente. Pressione Enter para cadastrar.
                    </div>
                  )}
                </div>
              </div>
            )}

            {customer && (
              <div className="flex items-center justify-between rounded-[1.4rem] border border-primary/10 bg-primary/5 p-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/50">
                    Cliente selecionado
                  </span>
                  <Link href={`/vendas-clientes/clientes/${customer.id}`} className="mt-1 text-sm font-black text-primary hover:underline">
                    {customer.fullName}
                  </Link>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCustomer(null);
                    setSearchTerm("");
                    setShowResults(false);
                  }}
                  className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={goToNewCustomer}
            className="h-12 w-full rounded-[1.3rem] bg-primary text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-primary/20 transition-all hover:bg-slate-900 hover:text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>

          <div className="space-y-4 rounded-[1.6rem] border border-slate-100 bg-slate-50/70 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="h-3.5 w-3.5" />
                <label className="text-[10px] font-black uppercase tracking-[0.2em]">Vendedor</label>
              </div>
              <select
                value={sellerId || ""}
                onChange={(event) => setSellerId(event.target.value)}
                className="flex h-12 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 text-sm font-semibold text-primary shadow-sm outline-none transition focus:border-primary/20"
              >
                <option value="">Selecione o vendedor</option>
                {initialData?.sellers?.map((seller: any) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.jobTitleName ? `${seller.name} - ${seller.jobTitleName}` : seller.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                <label className="text-[10px] font-black uppercase tracking-[0.2em]">Origem da venda</label>
              </div>
              <select
                value={leadSourceId || ""}
                onChange={(event) => setLeadSourceId(event.target.value)}
                className="flex h-12 w-full rounded-[1.2rem] border border-slate-200 bg-white px-4 text-sm font-semibold text-primary shadow-sm outline-none transition focus:border-primary/20"
              >
                <option value="">Selecione a origem</option>
                {initialData?.leadSources?.map((leadSource: any) => (
                  <option key={leadSource.id} value={leadSource.id}>
                    {leadSource.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLeadSource?.requiresDetail && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-600">
                  <Search className="h-3.5 w-3.5" />
                  <label className="text-[10px] font-black uppercase tracking-[0.2em]">Detalhe da origem</label>
                </div>
                <Input
                  placeholder={`Ex: campanha, parceiro ou detalhe de ${selectedLeadSource.name}`}
                  value={leadSourceDetail}
                  onChange={(event) => setLeadSourceDetail(event.target.value)}
                  className="h-12 rounded-[1.2rem] border-amber-200 bg-amber-50/80 px-4 text-sm font-semibold text-amber-950 shadow-sm focus-visible:ring-amber-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
