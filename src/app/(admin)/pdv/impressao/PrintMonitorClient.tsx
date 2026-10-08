"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Printer,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Calendar,
  Eye,
  HelpCircle,
  FileText,
  Sliders,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { OrderPrintDocument } from "./OrderPrintDocument";

interface PrintMonitorClientProps {
  initialOrders: any[];
}

export function PrintMonitorClient({ initialOrders = [] }: PrintMonitorClientProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(initialOrders[0] || null);
  const [format, setFormat] = useState<"a4" | "thermal">("a4"); // Padrão A4 Corporativo
  const [copies, setCopies] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "printed">("all");
  const [printedIds, setPrintedIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [showKioskGuide, setShowKioskGuide] = useState<boolean>(false);
  const [isPrintingNow, setIsPrintingNow] = useState<boolean>(false);
  const [onlineUrl, setOnlineUrl] = useState<string>("https://spadocolchao.vercel.app/pdv/impressao");

  // Carregar histórico local de impressos
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOnlineUrl(`${window.location.origin}/pdv/impressao`);
    }
    try {
      const stored = localStorage.getItem("spa_printed_order_ids");
      if (stored) {
        setPrintedIds(JSON.parse(stored));
      }
      const storedFormat = localStorage.getItem("spa_print_format");
      if (storedFormat === "a4" || storedFormat === "thermal") {
        setFormat(storedFormat as any);
      }
    } catch (_e) {}
  }, []);

  const markAsPrinted = useCallback((id: string) => {
    setPrintedIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [id, ...prev].slice(0, 500);
      try {
        localStorage.setItem("spa_printed_order_ids", JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    // Registrar no servidor
    fetch("/api/pdv/pedidos-impressao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, printerType: format, copies }),
    }).catch(() => {});
  }, [format, copies]);

  // Execução MANUAL de impressão acionada pelo usuário
  const handlePrint = (orderToPrint?: any) => {
    const target = orderToPrint || selectedOrder;
    if (!target) return;

    setIsPrintingNow(true);
    setSelectedOrder(target);

    // Pequeno delay para garantir que o DOM do documento selecionado esteja renderizado
    setTimeout(() => {
      window.print();
      markAsPrinted(target.id);
      setIsPrintingNow(false);
    }, 200);
  };

  // Polling apenas para ATUALIZAR a lista na tela (SEM NUNCA disparar impressão automática)
  useEffect(() => {
    const refreshList = async () => {
      try {
        const res = await fetch("/api/pdv/pedidos-impressao?limit=40", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setLastCheck(new Date());

          // Se não houver pedido selecionado ainda, seleciona o primeiro
          setSelectedOrder((current: any) => {
            if (!current && data.orders.length > 0) return data.orders[0];
            return current;
          });
        }
      } catch (err) {
        console.error("Erro ao sincronizar pedidos:", err);
      }
    };

    const interval = setInterval(refreshList, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/pdv/pedidos-impressao?limit=40", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
          setLastCheck(new Date());
          if (!selectedOrder && data.orders.length > 0) {
            setSelectedOrder(data.orders[0]);
          }
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtragem da lista
  const filteredOrders = orders.filter((order) => {
    const isPrinted = printedIds.includes(order.id);
    if (filterMode === "pending" && isPrinted) return false;
    if (filterMode === "printed" && !isPrinted) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const customerName = order.customer?.fullName?.toLowerCase() || "";
    const saleNumber = order.sale?.number?.toLowerCase() || "";
    const doc = order.customer?.document?.toLowerCase() || "";
    const phone = order.customer?.phone?.toLowerCase() || "";

    return (
      customerName.includes(term) ||
      saleNumber.includes(term) ||
      doc.includes(term) ||
      phone.includes(term)
    );
  });

  const handleFormatChange = (newFormat: "a4" | "thermal") => {
    setFormat(newFormat);
    try {
      localStorage.setItem("spa_print_format", newFormat);
    } catch (_e) {}
  };

  const pendingCount = orders.filter((o) => !printedIds.includes(o.id)).length;
  const printedCount = orders.filter((o) => printedIds.includes(o.id)).length;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* ESTILOS DE IMPRESSÃO DINÂMICOS (FOLHA A4 CORPORATIVA OU 80MM) */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${format === "a4" ? "A4 portrait" : "80mm auto"};
            margin: ${format === "a4" ? "8mm" : "0mm"};
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print,
          nav,
          aside,
          header,
          button,
          .print-hidden {
            display: none !important;
          }
          .order-print-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* CABEÇALHO DO MONITOR */}
      <header className="no-print sticky top-0 z-40 bg-[#02213f] text-white border-b border-blue-900/40 shadow-xl px-4 py-3 sm:px-6">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Título e Status */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Fichas de Produção & Expedição (PDV)
                </h1>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  Sincronizado
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 font-medium">
                Selecione o pedido na fila e clique para imprimir a Ficha Técnica A4.
              </p>
            </div>
          </div>

          {/* Opções de Impressão */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Formato */}
            <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-[11px] font-black">
              <button
                type="button"
                onClick={() => handleFormatChange("a4")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  format === "a4" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Folha A4 (Padrão)
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange("thermal")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  format === "thermal" ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Cupom 80mm
              </button>
            </div>

            {/* Vias */}
            <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-[11px] font-black">
              <button
                type="button"
                onClick={() => setCopies(1)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  copies === 1 ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                1 Via
              </button>
              <button
                type="button"
                onClick={() => setCopies(2)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  copies === 2 ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                2 Vias
              </button>
            </div>

            {/* Botão de Atualização Manual */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Atualizar lista de pedidos"
              className="h-10 w-10 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            {/* Botão Principal de Impressão */}
            <Button
              onClick={() => handlePrint()}
              disabled={!selectedOrder || isPrintingNow}
              className="h-10 px-5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Printer className="h-4 w-4" />
              {isPrintingNow ? "Abrindo Impressão..." : "Imprimir Ficha A4"}
            </Button>
          </div>
        </div>
      </header>

      {/* CORPO PRINCIPAL */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: LISTA DE ESCOLHA DE PEDIDOS (5 COLUNAS) */}
        <section className="no-print lg:col-span-5 flex flex-col gap-4">
          <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-black text-slate-900">
                    Selecione o Pedido
                  </CardTitle>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Clique em um pedido para visualizar e imprimir
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-black">
                    {pendingCount} novos
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                    {orders.length} total
                  </span>
                </div>
              </div>

              {/* Campo de Busca */}
              <div className="relative mt-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filtrar por cliente, venda, documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-xs font-medium"
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-1 mt-3">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    filterMode === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("pending")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    filterMode === "pending"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Novos ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("printed")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    filterMode === "printed"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Impressos ({printedCount})
                </button>
              </div>
            </CardHeader>

            {/* Lista dos Pedidos */}
            <CardContent className="p-3 max-h-[calc(100vh-280px)] overflow-y-auto space-y-2.5 custom-scrollbar">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">
                  Nenhum pedido encontrado.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const isPrinted = printedIds.includes(order.id);
                  const total = order.sale?.totalAmount || 0;
                  const itemsCount = order.sale?.items?.length || 0;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#02213f] bg-blue-50/50 shadow-md ring-2 ring-[#02213f]/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900">
                            #{order.sale?.number || order.id.slice(-6).toUpperCase()}
                          </span>
                          {isPrinted ? (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-black flex items-center gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Impresso
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-black flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              Novo
                            </span>
                          )}
                        </div>
                        <span className="font-black text-xs text-slate-950 font-outfit">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(total)}
                        </span>
                      </div>

                      <p className="font-black text-xs text-slate-800 truncate mb-1">
                        {order.customer?.fullName || "Cliente não informado"}
                      </p>

                      {/* Logística */}
                      <div className="flex flex-wrap gap-1.5 text-[9px] font-bold mb-2">
                        {order.deliveryDate && (
                          <span className="rounded bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 flex items-center gap-1">
                            <Truck className="h-2.5 w-2.5" />
                            Entrega: {new Date(order.deliveryDate).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {order.pickupDate && (
                          <span className="rounded bg-amber-100/90 text-amber-900 px-1.5 py-0.5 flex items-center gap-1">
                            <Package className="h-2.5 w-2.5" />
                            Retirada: {new Date(order.pickupDate).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.5">
                          {itemsCount} item(ns)
                        </span>
                      </div>

                      {/* Botão de Impressão Direta */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-semibold">
                          {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                          className="h-7 text-[10px] font-black rounded-lg gap-1 bg-[#02213f] hover:bg-slate-900 text-white"
                        >
                          <Printer className="h-3 w-3" />
                          Imprimir Ficha
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* COLUNA DIREITA: VISUALIZAÇÃO CORPORATIVA A4 (7 COLUNAS) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Barra Superior da Visualização */}
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Visualização Prévia da Ficha de Produção
              </p>
              <h2 className="text-base font-black text-slate-900">
                {selectedOrder
                  ? `Venda #${selectedOrder.sale?.number || selectedOrder.id} • ${selectedOrder.customer?.fullName}`
                  : "Selecione um pedido na lista ao lado"}
              </h2>
            </div>

            <Button
              onClick={() => handlePrint()}
              disabled={!selectedOrder || isPrintingNow}
              className="h-11 px-6 rounded-xl bg-[#02213f] text-white hover:bg-slate-900 text-xs font-black uppercase tracking-wider gap-2 shadow-lg shadow-blue-950/20"
            >
              <Printer className="h-4 w-4" />
              {isPrintingNow ? "Imprimindo..." : "Imprimir Esta Ficha (Ctrl + P)"}
            </Button>
          </div>

          {/* DOCUMENTO RENDERIZADO */}
          <div className="bg-slate-200/70 rounded-3xl p-4 sm:p-8 border border-slate-300/80 shadow-inner flex justify-center overflow-x-auto min-h-[600px]">
            {selectedOrder ? (
              <OrderPrintDocument
                order={selectedOrder}
                format={format}
                copies={copies}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center text-slate-400">
                <FileText className="h-14 w-14 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Nenhum pedido selecionado.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Clique em qualquer pedido da fila ao lado para carregar a Ficha Técnica de Produção.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
