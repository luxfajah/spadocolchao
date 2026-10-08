"use client";

import { useState } from "react";
import { Check, Sparkles, Layers, Footprints, Palette, Ribbon } from "lucide-react";
import { usePos } from "../PosContext";

interface BoxCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// 1. Cartela de Cores de Tecido para Revestimento do Box (Veludo)
const BOX_FABRIC_COLORS = [
  { id: "bege", name: "Bege Areia", hex: "#D4C4B5", desc: "Clássico, neutro e suave", isLight: true },
  { id: "grafite", name: "Cinza Grafite", hex: "#4A4E51", desc: "Moderno e sofisticado", isLight: false },
  { id: "preto", name: "Preto Ônix", hex: "#1A1A1A", desc: "Elegante e resistente", isLight: false },
  { id: "marrom", name: "Marrom Café", hex: "#5A3825", desc: "Rústico e acolhedor", isLight: false },
  { id: "marinho", name: "Azul Marinho", hex: "#1B2A4A", desc: "Tom nobre e contemporâneo", isLight: false },
  { id: "cinza", name: "Cinza Prata", hex: "#A9ACB0", desc: "Iluminado e acetinado", isLight: true },
  { id: "offwhite", name: "Off-White Pérola", hex: "#EDEBE6", desc: "Requinte e sofisticação", isLight: true },
  { id: "bordo", name: "Bordô Vinho", hex: "#5E1926", desc: "Personalidade marcante", isLight: false },
];

// 2. Opções de Fitilho de Acabamento (Debrum do Box)
const FITILHO_OPTIONS = [
  {
    id: "tom_sobre_tom",
    code: "INS-FIT-035",
    name: "Fitilho Tom sobre Tom",
    desc: "Mesma cor do veludo para acabamento discreto e homogêneo",
    badge: "Mais Escolhido",
  },
  {
    id: "fitilho_branco",
    code: "INS-FIT-035",
    name: "Fitilho Branco Clássico",
    desc: "Fitim debrum 35mm padrão para contraste iluminado",
    badge: "Contraste",
  },
  {
    id: "fitilho_bege",
    code: "INS-FIT-035",
    name: "Fitilho Bege Linho",
    desc: "Acabamento suave em tom areia / fendi",
    badge: "Neutro",
  },
  {
    id: "fitilho_grafite",
    code: "INS-FIT-035",
    name: "Fitilho Cinza Grafite",
    desc: "Tom sóbrio e moderno para bordas escuras",
    badge: "Moderno",
  },
  {
    id: "fitilho_preto",
    code: "INS-FIT-035",
    name: "Fitilho Preto Ônix",
    desc: "Destaque marcante e alta durabilidade",
    badge: "Marcante",
  },
  {
    id: "fitilho_colmeia",
    code: "INS-FIT-COL",
    name: "Fitim Colméia Especial",
    desc: "Borda texturizada em colméia de alto relevo",
    badge: "Linha Especial",
  },
];

// 3. Opções de Pézinhos do Box
const BOX_FEET_OPTIONS = [
  {
    id: "pe_12_preto",
    code: "INS-PE-PLA-12",
    name: "Pé Plástico 12cm Preto",
    badge: "Padrão Box",
    desc: "Injetado com rosca americana metálica 5/16",
  },
  {
    id: "pe_06_preto",
    code: "INS-PE-PLA-06",
    name: "Pé Plástico 6cm Rebaixado",
    badge: "Ideal p/ Baú",
    desc: "Rebaixado 6cm para ergonomia de altura em Baús",
  },
  {
    id: "pe_12_madeira",
    code: "INS-PE-PLA-12",
    name: "Pé Madeira Maciça 12cm",
    badge: "Elegance",
    desc: "Madeira torneada com acabamento nobre",
  },
  {
    id: "pe_rodizio",
    code: "INS-PE-PLA-12",
    name: "Pés c/ Rodízio Móvel",
    badge: "Praticidade",
    desc: "2 rodízios com trava para facilitar limpeza",
  },
  {
    id: "sem_pes",
    code: null,
    name: "Sem Pés",
    badge: "Embutido / Alvenaria",
    desc: "Não adicionar pés (para cama embutida ou alvenaria)",
  },
];

export function BoxCustomizationForm({
  product,
  onAdd,
  onCancel,
}: BoxCustomizationFormProps) {
  const { initialData } = usePos();

  const isBau = product.name?.toLowerCase().includes("baú") || product.category?.toLowerCase().includes("baú");

  // Estado das escolhas de personalização
  const [selectedFabric, setSelectedFabric] = useState(BOX_FABRIC_COLORS[0]);
  const [customFabricName, setCustomFabricName] = useState("");

  const [selectedFitilho, setSelectedFitilho] = useState(FITILHO_OPTIONS[0]);
  const [customFitilhoName, setCustomFitilhoName] = useState("");

  const [selectedFeet, setSelectedFeet] = useState(
    isBau ? BOX_FEET_OPTIONS[1] : BOX_FEET_OPTIONS[0]
  );

  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(product.price || 0);
  const [technicalNotes, setTechnicalNotes] = useState("");

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mapear suprimentos do banco
  const supplyItems = initialData?.supplyItems || [];
  const veludoSupply = supplyItems.find((s: any) => s.code === "INS-TEC-VEL" || s.name?.toLowerCase().includes("veludo"));
  const feetSupply = selectedFeet.code ? supplyItems.find((s: any) => s.code === selectedFeet.code) : null;
  const fitilhoSupply = selectedFitilho.code ? supplyItems.find((s: any) => s.code === selectedFitilho.code) : null;

  const handleSubmit = () => {
    const finalFabricColor = customFabricName.trim() ? customFabricName.trim() : selectedFabric.name;
    const finalFitilhoColor = customFitilhoName.trim()
      ? customFitilhoName.trim()
      : (selectedFitilho.id === "tom_sobre_tom" ? `Tom sobre Tom (${finalFabricColor})` : selectedFitilho.name);

    const details = {
      // Revestimento do Box
      boxFabricColor: finalFabricColor,
      boxFabricColorHex: selectedFabric.hex,
      sideFabricColor: finalFabricColor,
      sideFabricId: veludoSupply?.id || null,

      // Fitilho
      fitilhoColor: finalFitilhoColor,
      fitilhoType: selectedFitilho.name,
      fitilhoSupplyItemId: fitilhoSupply?.id || null,

      // Pézinhos
      feetType: selectedFeet.name,
      feetSupplyItemId: feetSupply?.id || null,
      hasFeet: selectedFeet.id !== "sem_pes",

      // Observações e Resumo de Engenharia
      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: `Revestimento Box: ${finalFabricColor} • Fitilho: ${finalFitilhoColor} • Pés: ${selectedFeet.name}`,
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        
        {/* Cabeçalho do Box */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Personalização Exclusiva de Box
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <Layers className="h-3 w-3 text-emerald-600" />
              <span>Ficha Técnica Box Ativa</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Linha: <strong className="text-slate-700">{product.category}</strong> • Estrutura em madeira/MDF calculada automaticamente.
          </p>
        </div>

        {/* 1. SELEÇÃO DO TECIDO DE REVESTIMENTO DO BOX */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tecido de Revestimento do Box (Veludo)</h4>
                <p className="text-[11px] text-slate-500">Escolha a cor do revestimento lateral e acabamento da caixa</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-black text-primary">
              {customFabricName.trim() ? customFabricName : selectedFabric.name}
            </span>
          </div>

          {/* Grid de Cores do Tecido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {BOX_FABRIC_COLORS.map((c) => {
              const isSelected = selectedFabric.id === c.id && !customFabricName.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedFabric(c);
                    setCustomFabricName("");
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

          {/* Cor de Tecido Especial / Fora do Catálogo */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outra cor:</span>
            <input
              type="text"
              placeholder="Digite se o cliente escolheu veludo sob encomenda..."
              value={customFabricName}
              onChange={(e) => setCustomFabricName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 2. SELEÇÃO DO FITILHO (DEBRUM DO BOX) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Ribbon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Fitilho de Acabamento (Debrum)</h4>
                <p className="text-[11px] text-slate-500">Defina o cordão/fitilho que fecha as bordas da caixa</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[180px]">
              {customFitilhoName.trim() ? customFitilhoName : selectedFitilho.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {FITILHO_OPTIONS.map((f) => {
              const isSelected = selectedFitilho.id === f.id && !customFitilhoName.trim();
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFitilho(f);
                    setCustomFitilhoName("");
                  }}
                  className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {f.badge}
                    </span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{f.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{f.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Fitilho Especial / Personalizado */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro fitilho:</span>
            <input
              type="text"
              placeholder="Digite cor ou acabamento especial do fitilho..."
              value={customFitilhoName}
              onChange={(e) => setCustomFitilhoName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 3. SELEÇÃO DO TIPO DE PÉZINHOS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Footprints className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tipo de Pézinhos do Box</h4>
                <p className="text-[11px] text-slate-500">Defina o modelo de sustentação e elevação do box</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600">
              {selectedFeet.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {BOX_FEET_OPTIONS.map((f) => {
              const isSelected = selectedFeet.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFeet(f)}
                  className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {f.badge}
                    </span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{f.name}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{f.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. QUANTIDADE, PREÇO E OBSERVAÇÕES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Quantidade de Peças
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

        {/* Observações de Montagem e Entrega */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Observações Técnicas / Montagem (Opcional)
          </label>
          <input
            type="text"
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Ex: Pés embalados à parte, fixar chapas de união bipartido..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Card Resumo do Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total do Item ({quantity} {quantity > 1 ? "peças" : "peça"})</p>
            <p className="font-outfit text-2xl font-black text-white tabular-nums tracking-tight">
              {formatBRL(unitPrice * quantity)}
            </p>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <p className="text-[11px] text-slate-200 font-bold">
              {customFabricName.trim() ? customFabricName : selectedFabric.name} • {customFitilhoName.trim() ? customFitilhoName : selectedFitilho.name}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {selectedFeet.name} • Baixa de estoque automática
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
          Adicionar Box ao Pedido
        </button>
      </div>
    </div>
  );
}
