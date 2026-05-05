"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Clock3,
  Layers3,
  MapPinned,
  ReceiptText,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react";
import { usePos } from "./PosContext";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function SnapshotCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white/10 text-white/90">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">{label}</p>
      <p className="mt-2 text-base font-black leading-snug text-white">{value}</p>
      <p className="mt-2 text-xs text-white/60">{hint}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/12 bg-slate-950/15 p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white/10 text-white/90">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">{label}</p>
      <p className="mt-2 font-outfit text-2xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-white/60">{hint}</p>
    </div>
  );
}

export function PosHeader() {
  const { customer, sellerId, leadSourceId, initialData, items, subtotal, total } = usePos();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const sellerName = useMemo(
    () => initialData?.sellers?.find((seller: any) => seller.id === sellerId)?.name ?? "Defina o vendedor",
    [initialData, sellerId]
  );

  const leadSourceName = useMemo(
    () =>
      initialData?.leadSources?.find((source: any) => source.id === leadSourceId)?.name ??
      initialData?.leadSources?.find((source: any) => source.isDefaultPdv)?.name ??
      "Defina a origem",
    [initialData, leadSourceId]
  );

  const openingBalance = Number(initialData?.session?.openingBalance ?? 0);

  return (
    <div className="relative overflow-hidden rounded-[2.35rem] bg-[linear-gradient(135deg,#02213f_0%,#0b3156_42%,#14507e_100%)] px-5 py-6 text-white shadow-[0_32px_70px_-28px_rgba(0,34,66,0.8)] sm:px-6 lg:px-8">
      <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-sky-200/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-white/20 bg-white/10 backdrop-blur">
              <Store className="h-7 w-7" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                Novo cabecalho PDV
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-50">
                Caixa aberto
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-100/70">Frente de caixa</p>
              <h2 className="font-outfit text-4xl font-black uppercase tracking-tight sm:text-5xl">
                Ponto de venda com mais leitura
              </h2>
            </div>
            <p className="max-w-2xl text-sm text-slate-200 sm:text-[15px]">
              Cliente, catalogo, carrinho e fechamento agora respiram melhor na tela para acelerar o
              atendimento no balcao.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SnapshotCard
              icon={UserRound}
              label="Cliente"
              value={customer?.fullName ?? "Selecione um cliente"}
              hint={customer?.document ?? "Sem cadastro selecionado"}
            />
            <SnapshotCard
              icon={WalletCards}
              label="Vendedor"
              value={sellerName}
              hint={sellerId ? "Responsavel pela venda" : "Defina antes de fechar"}
            />
            <SnapshotCard
              icon={MapPinned}
              label="Origem"
              value={leadSourceName}
              hint={leadSourceId ? "Rastreio da oportunidade" : "Use a origem padrão do PDV"}
            />
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[460px]">
          <MetricCard
            icon={Layers3}
            label="Itens no pedido"
            value={items.length.toString().padStart(2, "0")}
            hint="Contagem ativa do carrinho"
          />
          <MetricCard
            icon={WalletCards}
            label="Subtotal"
            value={formatBRL(subtotal)}
            hint="Antes do desconto global"
          />
          <MetricCard
            icon={ReceiptText}
            label="Total atual"
            value={formatBRL(total)}
            hint="Valor usado no fechamento"
          />
          <MetricCard
            icon={Clock3}
            label="Sessao de caixa"
            value={formatBRL(openingBalance)}
            hint={new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(now)}
          />
        </div>
      </div>
    </div>
  );
}
