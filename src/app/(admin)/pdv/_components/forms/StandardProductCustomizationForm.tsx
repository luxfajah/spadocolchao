"use client";

import { useState } from "react";
import { Check, Layers, Palette } from "lucide-react";
import { usePos } from "../PosContext";

interface StandardProductCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// Cartela de Cores de Tecido para Reforma ou Colchão
const FABRIC_COLORS = [
  { id: "bege", name: "Bege Areia", hex: "#D4C4B5", desc: "Clássico, neutro e suave", isLight: true },
  { id: "grafite", name: "Cinza Grafite", hex: "#4A4E51", desc: "Moderno e sofisticado", isLight: false },
  { id: "preto", name: "Preto Ônix", hex: "#1A1A1A", desc: "Elegante e resistente", isLight: false },
  { id: "marrom", name: "Marrom Café", hex: "#5A3825", desc: "Rústico e acolhedor", isLight: false },
  { id: "marinho", name: "Azul Marinho", hex: "#1B2A4A", desc: "Tom nobre e contemporâneo", isLight: false },
  { id: "cinza", name: "Cinza Prata", hex: "#A9ACB0", desc: "Iluminado e acetinado", isLight: true },
  { id: "offwhite", name: "Off-White Pérola", hex: "#EDEBE6", desc: "Requinte e sofisticação", isLight: true },
  { id: "bordo", name: "Bordô Vinho", hex: "#5E1926", desc: "Personalidade marcante", isLight: false },
];

export function StandardProductCustomizationForm({
  product,
  onAdd,
  onCancel,
}: StandardProductCustomizationFormProps) {
  const { initialData } = usePos();

  const [selectedColor, setSelectedColor] = useState(FABRIC_COLORS[0]);
  const [customColorName, setCustomColorName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(product.price || 0);
  const [technicalNotes, setTechnicalNotes] = useState("");

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mapear insumo de veludo
  const supplyItems = initialData?.supplyItems || [];
  const veludoSupply = supplyItems.find((s: any) => s.code === "INS-TEC-VEL" || s.name?.toLowerCase().includes("veludo"));

  const handleSubmit = () => {
    const finalColorName = customColorName.trim() ? customColorName.trim() : selectedColor.name;

    const details = {
      // Tecido
      sideColor: finalColorName,
      sideFabricColor: finalColorName,
      sideFabricId: veludoSupply?.id || null,
      fabricColorHex: selectedColor.hex,

      // Sem pés nem fitilho para reformas
      hasFeet: false,
      feetType: null,
      feetSupplyItemId: null,

      // Observações e Resumo
      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: `Tecido: ${finalColorName}`,
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        
        {/* Cabeçalho do Produto / Reforma */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Personalização do Pedido
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <Layers className="h-3 w-3 text-emerald-600" />
              <span>Ficha Técnica Automática</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Categoria: <strong className="text-slate-700">{product.category}</strong> • Baixa de materiais calculada pela Ficha Técnica.
          </p>
        </div>

        {/* 1. SELEÇÃO DA COR DO TECIDO */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Cor do Tecido</h4>
                <p className="text-[11px] text-slate-500">Escolha a cor do revestimento ou veludo desejado</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-black text-primary">
              {customColorName.trim() ? customColorName : selectedColor.name}
            </span>
          </div>

          {/* Grid de Cores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {FABRIC_COLORS.map((c) => {
              const isSelected = selectedColor.id === c.id && !customColorName.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c);
                    setCustomColorName("");
                  }}
                  className={`group relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className="h-6 w-6 rounded-full shrink-0 border border-black/10 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check className={`h-3.5 w-3.5 stroke-[3] ${c.isLight ? "text-slate-900" : "text-white"}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate">{c.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{c.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Outra Cor sob Encomenda */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outra cor:</span>
            <input
              type="text"
              placeholder="Digite se o cliente escolheu cor fora da cartela ou tecido próprio..."
              value={customColorName}
              onChange={(e) => setCustomColorName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 2. QUANTIDADE E PREÇO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Quantidade
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <span className="font-outfit text-2xl font-black text-slate-900 w-12 text-center tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Preço Unitário Negociado (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-outfit text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"
            />
          </div>
        </div>

        {/* Observações Livres */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Observações Técnicas / Entrega (Opcional)
          </label>
          <input
            type="text"
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Ex: Cliente traz colchão na segunda-feira, vivo branco, etc..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Resumo do Total */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total do Item ({quantity} {quantity > 1 ? "itens" : "item"})</p>
            <p className="font-outfit text-2xl font-black text-white tabular-nums tracking-tight">
              {formatBRL(unitPrice * quantity)}
            </p>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <p className="text-[11px] text-slate-200 font-bold">
              {customColorName.trim() ? customColorName : selectedColor.name}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Insumos calculados automaticamente pela Ficha Técnica
            </p>
          </div>
        </div>

      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 bg-white sm:bg-transparent">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
        >
          Adicionar ao Pedido
        </button>
      </div>
    </div>
  );
}
