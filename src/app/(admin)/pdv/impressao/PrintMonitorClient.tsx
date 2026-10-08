"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Printer,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Calendar,
  Eye,
  Settings,
  HelpCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  Sliders,
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
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const [copies, setCopies] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "printed">("all");
  const [printedIds, setPrintedIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [showKioskGuide, setShowKioskGuide] = useState<boolean>(false);
  const [isPrintingNow, setIsPrintingNow] = useState<boolean>(false);

  // Armazenar IDs já impressos no localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("spa_printed_order_ids");
      if (stored) {
        setPrintedIds(JSON.parse(stored));
      }
      const storedAuto = localStorage.getItem("spa_autoprint_enabled");
      if (storedAuto !== null) {
        setAutoPrint(storedAuto === "true");
      }
      const storedFormat = localStorage.getItem("spa_print_format");
      if (storedFormat === "a4" || storedFormat === "thermal") {
        setFormat(storedFormat);
      }
    } catch (_e) {
      // Ignorar erros de storage
    }
  }, []);

  const savePrintedId = useCallback((id: string) => {
    setPrintedIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [id, ...prev].slice(0, 500);
      try {
        localStorage.setItem("spa_printed_order_ids", JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    // Notificar o backend sobre o registro de impressão
    fetch("/api/pdv/pedidos-impressao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, printerType: format, copies }),
    }).catch(() => {});
  }, [format, copies]);

  // Sintetizador de Som com Web Audio API
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Primeiro tom (sol - 784 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(784, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      // Segundo tom (dó agudo - 1046 Hz)
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1046, ctx.currentTime);
          gain2.gain.setValueAtTime(0.2, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.5);
        } catch (_e) {}
      }, 150);
    } catch (_e) {
      // Navegadores podem bloquear áudio antes de interação
    }
  }, [soundEnabled]);

  // Função para executar a impressão do pedido selecionado
  const executePrint = useCallback((orderToPrint: any) => {
    if (!orderToPrint) return;
    setIsPrintingNow(true);
    setSelectedOrder(orderToPrint);

    setTimeout(() => {
      window.print();
      savePrintedId(orderToPrint.id);
      setIsPrintingNow(false);
    }, 250);
  }, [savePrintedId]);

  // Polling em tempo real a cada 3.5 segundos
  useEffect(() => {
    const checkNewOrders = async () => {
      try {
        const res = await fetch("/api/pdv/pedidos-impressao?limit=30", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
          setLastCheck(new Date());

          // Se auto-print estiver ligado, buscar se tem algum pedido recente ainda não impresso
          if (autoPrint) {
            const stored = JSON.parse(localStorage.getItem("spa_printed_order_ids") || "[]");
            const unprintedOrders = data.orders.filter(
              (o: any) => !stored.includes(o.id) && !printedIds.includes(o.id)
            );

            if (unprintedOrders.length > 0) {
              const newestOrder = unprintedOrders[0];
              playAlertSound();
              executePrint(newestOrder);
            }
          }
        }
      } catch (err) {
        console.error("Erro no polling de impressão:", err);
      }
    };

    const interval = setInterval(checkNewOrders, 3500);
    return () => clearInterval(interval);
  }, [autoPrint, printedIds, playAlertSound, executePrint]);

  // Atualização manual
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/pdv/pedidos-impressao?limit=30", { cache: "no-store" });
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

  // Filtragem de pedidos
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

  const toggleAutoPrint = () => {
    const next = !autoPrint;
    setAutoPrint(next);
    try {
      localStorage.setItem("spa_autoprint_enabled", String(next));
    } catch (_e) {}
  };

  const handleFormatChange = (newFormat: "thermal" | "a4") => {
    setFormat(newFormat);
    try {
      localStorage.setItem("spa_print_format", newFormat);
    } catch (_e) {}
  };

  const pendingCount = orders.filter((o) => !printedIds.includes(o.id)).length;
  const printedCount = orders.filter((o) => printedIds.includes(o.id)).length;

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* ESTILOS DE IMPRESSÃO DINÂMICOS (TÉRMICA 80MM OU FOLHA A4) */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${format === "thermal" ? "80mm auto" : "A4 portrait"};
            margin: ${format === "thermal" ? "0mm" : "8mm"};
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
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
            width: ${format === "thermal" ? "80mm !important" : "100% !important"};
            max-width: ${format === "thermal" ? "80mm !important" : "100% !important"};
            margin: 0 auto !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* BARRA SUPERIOR DE CONTROLE E MONITORAMENTO */}
      <header className="no-print sticky top-0 z-40 bg-[#02213f] text-white border-b border-blue-900/40 shadow-xl px-4 py-3 sm:px-6">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo e Status */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
              <Printer className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase">
                  Central de Impressão PDV
                </h1>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Tempo Real
                </span>
              </div>
              <p className="text-[11px] text-sky-200/80 font-semibold">
                Monitoramento contínuo para computadores Windows • Atualizado às{" "}
                {lastCheck.toLocaleTimeString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Controles Principais */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle de Impressão Automática */}
            <button
              onClick={toggleAutoPrint}
              type="button"
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                autoPrint
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {autoPrint ? (
                <>
                  <Play className="h-4 w-4 fill-slate-950" />
                  Auto-Print Ativo
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 fill-slate-300" />
                  Auto-Print Pausado
                </>
              )}
            </button>

            {/* Alternador de Formato (80mm vs A4) */}
            <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 text-[11px] font-black">
              <button
                type="button"
                onClick={() => handleFormatChange("thermal")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  format === "thermal"
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Térmica 80mm
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange("a4")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  format === "a4"
                    ? "bg-sky-500 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Folha A4
              </button>
            </div>

            {/* Alternador de Vias */}
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

            {/* Toggle de Som */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Som ativado (clique para mutar)" : "Som desativado"}
              className="h-10 w-10 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            </Button>

            {/* Guia Kiosk Windows */}
            <Button
              variant="outline"
              onClick={() => setShowKioskGuide(true)}
              className="h-10 gap-1.5 rounded-xl border-slate-700 bg-slate-800/80 px-3 text-xs font-bold text-sky-200 hover:bg-slate-700"
            >
              <HelpCircle className="h-4 w-4" />
              Guia Windows
            </Button>

            {/* Atualizar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-10 w-10 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL DIVIDIDA */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: FILA DE PEDIDOS (5 COLUNAS) */}
        <section className="no-print lg:col-span-5 flex flex-col gap-4">
          {/* Card de Resumo e Filtros */}
          <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-black text-slate-900">
                    Fila de Pedidos do PDV
                  </CardTitle>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {orders.length} pedidos carregados
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-black">
                    {pendingCount} novos
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                    {printedCount} impressos
                  </span>
                </div>
              </div>

              {/* Busca Instantânea */}
              <div className="relative mt-3">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por cliente, venda, documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-xs font-medium"
                />
              </div>

              {/* Abas de Filtro */}
              <div className="flex gap-1 mt-3">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    filterMode === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todos ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("pending")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    filterMode === "pending" ? "bg-amber-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Novos ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("printed")}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    filterMode === "printed" ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Impressos ({printedCount})
                </button>
              </div>
            </CardHeader>

            {/* Lista dos Cards de Pedidos */}
            <CardContent className="p-3 max-h-[calc(100vh-290px)] overflow-y-auto space-y-2.5 custom-scrollbar">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-slate-400">
                  Nenhum pedido encontrado para o filtro selecionado.
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const isPrinted = printedIds.includes(order.id);
                  const itemsCount = order.sale?.items?.length || 0;
                  const total = order.sale?.totalAmount || 0;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`group p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#02213f] bg-blue-50/40 shadow-md ring-2 ring-[#02213f]/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900">
                            #{order.sale?.number || order.id.slice(-6).toUpperCase()}
                          </span>
                          {isPrinted ? (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-black flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Impresso
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-black animate-pulse flex items-center gap-1">
                              <Clock className="h-3 w-3" />
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

                      {/* Logística de Retirada e Entrega */}
                      <div className="flex flex-wrap gap-1.5 text-[9px] font-bold mb-2">
                        {order.pickupDate && (
                          <span className="rounded bg-amber-100/90 text-amber-900 px-1.5 py-0.5 flex items-center gap-1">
                            <Package className="h-2.5 w-2.5" />
                            Retirada: {new Date(order.pickupDate).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {order.deliveryDate && (
                          <span className="rounded bg-emerald-100/90 text-emerald-900 px-1.5 py-0.5 flex items-center gap-1">
                            <Truck className="h-2.5 w-2.5" />
                            Entrega: {new Date(order.deliveryDate).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span className="rounded bg-slate-100 text-slate-600 px-1.5 py-0.5">
                          {itemsCount} item(ns)
                        </span>
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <span className="text-slate-400 font-semibold">
                          {new Date(order.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              executePrint(order);
                            }}
                            className="h-7 text-[10px] font-black rounded-lg gap-1 border-slate-300 hover:bg-slate-100"
                          >
                            <Printer className="h-3 w-3" />
                            {isPrinted ? "Reimprimir" : "Imprimir"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* COLUNA DIREITA: VISUALIZAÇÃO E IMPRESSÃO (7 COLUNAS) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          {/* Barra de Ações do Documento Selecionado */}
          <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Visualização do Documento
              </p>
              <h2 className="text-base font-black text-slate-900">
                {selectedOrder
                  ? `Venda #${selectedOrder.sale?.number || selectedOrder.id} - ${selectedOrder.customer?.fullName}`
                  : "Selecione um pedido para visualizar"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => executePrint(selectedOrder)}
                disabled={!selectedOrder || isPrintingNow}
                className="h-11 px-6 rounded-xl bg-[#02213f] text-white hover:bg-slate-900 text-xs font-black uppercase tracking-wider gap-2 shadow-lg shadow-blue-950/20"
              >
                <Printer className="h-4 w-4" />
                {isPrintingNow ? "Imprimindo..." : "Imprimir Pedido (Ctrl + P)"}
              </Button>
            </div>
          </div>

          {/* O DOCUMENTO DE IMPRESSÃO REAL */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-sm overflow-x-auto min-h-[500px] flex justify-center">
            {selectedOrder ? (
              <OrderPrintDocument
                order={selectedOrder}
                format={format}
                copies={copies}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <Printer className="h-12 w-12 stroke-[1.5] mb-2" />
                <p className="text-sm font-bold">Nenhum pedido selecionado.</p>
                <p className="text-xs">Clique em qualquer pedido da fila ao lado para carregar.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* MODAL: GUIA WINDOWS KIOSK PRINTING */}
      <Dialog open={showKioskGuide} onOpenChange={setShowKioskGuide}>
        <DialogContent className="sm:max-w-[620px] rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Printer className="h-6 w-6 text-sky-600" />
              Como ativar a Impressão Silenciosa no Windows
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed pt-2">
            <p>
              No Windows, você pode configurar o navegador (Google Chrome ou Microsoft Edge) para{" "}
              <strong>imprimir diretamente na impressora padrão sem abrir a janela de diálogo</strong>.
              Isso permite automação 100% contínua no balcão e na expedição!
            </p>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="font-black text-slate-900 text-xs uppercase tracking-wider">
                Passo 1: Criar atalho no Windows
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                <li>Clique com o botão direito na Área de Trabalho do Windows e vá em <strong>Novo &gt; Atalho</strong>.</li>
                <li>No campo de destino, insira o comando abaixo:</li>
              </ol>
              <div className="rounded-xl bg-slate-900 text-sky-300 p-3 font-mono text-[11px] overflow-x-auto">
                chrome.exe --kiosk-printing &quot;http://localhost:3000/pdv/impressao&quot;
              </div>
              <p className="text-[10px] text-slate-500">
                * Para o Edge, substitua <code>chrome.exe</code> por <code>msedge.exe</code>.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <p className="font-black text-slate-900 text-xs uppercase tracking-wider">
                Passo 2: Definir a impressora padrão no Windows
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Vá em <strong>Configurações do Windows &gt; Dispositivos &gt; Impressoras e Scanners</strong>.</li>
                <li>Selecione sua impressora térmica (ex: Elgin, Bematech, Epson) ou impressora A4.</li>
                <li>Clique em <strong>Gerenciar &gt; Definir como padrão</strong>.</li>
              </ul>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-900 text-[11px]">
              <strong>Pronto!</strong> Ao abrir o atalho, cada novo pedido feito no PDV tocará o alarme
              e será impresso automaticamente na impressora física sem qualquer clique adicional.
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              onClick={() => setShowKioskGuide(false)}
              className="rounded-full bg-slate-900 text-white px-6 font-bold text-xs"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
