"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, MapPin, Search, Trash2, UserPlus, Users, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePos } from "./PosContext";
import { RegisterCustomerModal } from "@/app/app-vendedor/_components/RegisterCustomerModal";

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
      const defaultSource = initialData.leadSources.find((s: any) => s.isDefaultPdv);
      if (defaultSource) setLeadSourceId(defaultSource.id);
    }
  }, [initialData, leadSourceId, setLeadSourceId]);

  const selectedLeadSource = useMemo(
    () => initialData?.leadSources?.find((s: any) => s.id === leadSourceId),
    [initialData, leadSourceId]
  );

  const selectedSeller = useMemo(
    () => initialData?.sellers?.find((s: any) => s.id === sellerId),
    [initialData, sellerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return (initialData?.customers || []).filter(
      (c: any) =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.document && c.document.includes(searchTerm))
    );
  }, [initialData, searchTerm]);

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const goToNewCustomer = () => {
    if (typeof window !== "undefined" && window.location.pathname.includes('/app-vendedor')) {
      setShowAddCustomerModal(true);
    } else {
      localStorage.setItem("pdv_draft", JSON.stringify({ items, sellerId, leadSourceId, globalDiscount }));
      window.location.href = "/vendas-clientes/clientes/new?from=pdv";
    }
  };

  const bothReady = !!customer && !!leadSourceId;

  return (
    <div className="flex flex-col gap-3">
      {/* Status Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
          customer ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}>
          {customer ? <Check className="h-3 w-3" /> : <Users className="h-3 w-3" />}
          {customer ? customer.fullName.split(" ")[0] : "Cliente"}
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
          leadSourceId ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}>
          {leadSourceId ? <Check className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {selectedLeadSource?.name || "Origem"}
        </div>
        {selectedSeller && (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
            <Check className="h-3 w-3" />
            {selectedSeller.name.split(" ")[0]}
          </div>
        )}
      </div>

      {/* Card de Cliente */}
      <div className="rounded-2xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Users className="h-3 w-3" /> Cliente *
        </p>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Nome ou CPF do cliente..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onKeyDown={(e) => { if (e.key === "Enter" && !customer) goToNewCustomer(); }}
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-primary shadow-inner focus-visible:ring-primary/15"
          />
        </div>

        {/* Dropdown de resultados */}
        {showResults && searchTerm.length >= 2 && !customer && (
          <div className="mt-1.5 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl z-50 relative">
            <div className="max-h-52 overflow-y-auto">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCustomer(c); setSearchTerm(c.fullName); setShowResults(false); }}
                    className="flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                      {c.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{c.fullName}</p>
                      <p className="text-xs text-slate-400">{c.document || "Sem CPF"}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum cliente encontrado</p>
                  <button onClick={goToNewCustomer} className="mt-2 text-xs font-bold text-primary underline">
                    Cadastrar novo cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cliente selecionado */}
        {customer && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Selecionado</p>
              <p className="text-sm font-black text-emerald-800">{customer.fullName}</p>
            </div>
            <button
              onClick={() => { setCustomer(null); setSearchTerm(""); setShowResults(false); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={goToNewCustomer}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-transparent py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-primary hover:text-primary transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Novo cliente
        </button>
      </div>

      {/* Card de Origem */}
      <div className="rounded-2xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Origem da Venda *
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(initialData?.leadSources || []).map((source: any) => (
            <button
              key={source.id}
              type="button"
              onClick={() => setLeadSourceId(source.id)}
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                leadSourceId === source.id
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              <span className="text-xs font-black leading-tight">{source.name}</span>
            </button>
          ))}
        </div>

        {selectedLeadSource?.requiresDetail && (
          <div className="mt-3">
            <Input
              placeholder={`Detalhe: ${selectedLeadSource.name}`}
              value={leadSourceDetail}
              onChange={(e) => setLeadSourceDetail(e.target.value)}
              className="h-10 rounded-xl border-amber-200 bg-amber-50 px-3 text-sm text-amber-900 placeholder:text-amber-400 focus-visible:ring-amber-200"
            />
          </div>
        )}
      </div>

      {/* Seller — apenas se não houver auto-seleção */}
      {!initialData?.currentSellerId && (
        <div className="rounded-2xl border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Users className="h-3 w-3" /> Vendedor
          </p>
          <select
            value={sellerId || ""}
            onChange={(e) => setSellerId(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-primary shadow-sm outline-none focus:border-primary/30"
          >
            <option value="">Selecione o vendedor</option>
            {initialData?.sellers?.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.jobTitleName ? `${s.name} — ${s.jobTitleName}` : s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <RegisterCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        sellerId={sellerId}
        onSuccess={(cust) => {
          setCustomer({ id: cust.id, fullName: cust.fullName });
          setShowAddCustomerModal(false);
        }}
      />
    </div>
  );
}
