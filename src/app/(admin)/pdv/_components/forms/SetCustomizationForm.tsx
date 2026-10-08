"use client";

import { useState } from "react";
import { Check, Sparkles, Layers, Footprints, Palette, Ribbon, RefreshCw } from "lucide-react";
import { usePos } from "../PosContext";
import { detectMattressDimensions, getExtraFoamPricing } from "@/lib/pricing/foam-pricing";

interface SetCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// 1. Camada Extra de Espuma para o COLCHÃO do Conjunto (NÃO existe em box)
const EXTRA_FOAM_OPTIONS = [
  {
    id: "sem_extra",
    code: null,
    height: 0,
    name: "Sem Camada Extra (Padrão de Fábrica)",
    badge: "Padrão",
    desc: "Mantém a densidade e estrutura original da ficha técnica do colchão",
  },
  {
    id: "extra_d28_3cm",
    code: "INS-ESP-D28",
    height: 3,
    name: "Camada Extra +3cm Espuma D-28 Soft",
    badge: "+3cm Macio",
    desc: "Pillow top de toque macio e alívio de pressão nos pontos de apoio",
  },
  {
    id: "extra_d28_5cm",
    code: "INS-ESP-D28",
    height: 5,
    name: "Camada Extra +5cm Espuma D-28 Conforto",
    badge: "+5cm Conforto",
    desc: "Espuma D28 com 5cm para conforto intermediário superior",
  },
  {
    id: "extra_r26_5cm",
    code: "INS-ESP-R26-5CM",
    height: 5,
    name: "Camada Extra +5cm Ortopédica Firme (R-26)",
    badge: "+5cm Firme",
    desc: "Aglomerado de alta sustentação para firmeza postural e durabilidade",
  },
];

// 2. Tecido do Tampo Superior do Colchão
const TOP_FABRIC_OPTIONS = [
  {
    id: "matelasse_branco",
    code: "INS-TEC-MAT",
    name: "Matelassê Branco Acolchoado",
    desc: "Padrão de Fábrica • Máximo frescor e acolchoamento nobre",
    badge: "Padrão Fábrica",
  },
  {
    id: "matelasse_bege",
    code: "INS-TEC-MAT",
    name: "Matelassê Bege Linho",
    desc: "Harmonia perfeita com veludos terrosos e decorações acolhedoras",
    badge: "Requinte",
  },
  {
    id: "matelasse_grafite",
    code: "INS-TEC-MAT",
    name: "Matelassê Cinza Grafite",
    desc: "Alta proteção contra manchas e visual contemporâneo",
    badge: "Moderno",
  },
  {
    id: "mesmo_veludo",
    code: "INS-TEC-VEL",
    name: "Mesmo Tecido da Faixa Lateral",
    desc: "Acabamento monocromático integral em veludo",
    badge: "Monocromático",
  },
];

// 3. Cartela de Cores de Tecido para as Faixas Laterais do Colchão e do Box
const SET_FABRIC_COLORS = [
  { id: "bege", name: "Bege Areia", hex: "#D4C4B5", desc: "Clássico, neutro e suave", isLight: true },
  { id: "grafite", name: "Cinza Grafite", hex: "#4A4E51", desc: "Moderno e sofisticado", isLight: false },
  { id: "preto", name: "Preto Ônix", hex: "#1A1A1A", desc: "Elegante e resistente", isLight: false },
  { id: "marrom", name: "Marrom Café", hex: "#5A3825", desc: "Rústico e acolhedor", isLight: false },
  { id: "marinho", name: "Azul Marinho", hex: "#1B2A4A", desc: "Tom nobre e contemporâneo", isLight: false },
  { id: "cinza", name: "Cinza Prata", hex: "#A9ACB0", desc: "Iluminado e acetinado", isLight: true },
  { id: "offwhite", name: "Off-White Pérola", hex: "#EDEBE6", desc: "Requinte e sofisticação", isLight: true },
  { id: "bordo", name: "Bordô Vinho", hex: "#5E1926", desc: "Personalidade marcante", isLight: false },
];

// 4. Fitilhos de Fechamento (Debrum)
const FITILHO_OPTIONS = [
  {
    id: "tom_sobre_tom",
    code: "INS-FIT-035",
    name: "Fitilho Tom sobre Tom",
    desc: "Mesma cor do veludo para acabamento contínuo e elegante",
    badge: "Mais Escolhido",
  },
  {
    id: "fitilho_branco",
    code: "INS-FIT-035",
    name: "Fitilho Branco Clássico",
    desc: "Fitim 35mm clássico iluminando as bordas",
    badge: "Padrão",
  },
  {
    id: "fitilho_bege",
    code: "INS-FIT-035",
    name: "Fitilho Bege Linho",
    desc: "Borda suave em tom areia / fendi",
    badge: "Suave",
  },
  {
    id: "fitilho_grafite",
    code: "INS-FIT-035",
    name: "Fitilho Cinza Grafite",
    desc: "Tom sóbrio e moderno para bordas escuras",
    badge: "Sóbrio",
  },
  {
    id: "fitilho_preto",
    code: "INS-FIT-035",
    name: "Fitilho Preto Ônix",
    desc: "Destaque marcante e alta presença",
    badge: "Marcante",
  },
  {
    id: "fitilho_colmeia",
    code: "INS-FIT-COL",
    name: "Fitim Colméia Especial",
    desc: "Borda texturizada em colméia de alto padrão",
    badge: "Especial",
  },
];

// 5. Pés da Cama Box
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

export function SetCustomizationForm({
  product,
  onAdd,
  onCancel,
}: SetCustomizationFormProps) {
  const { initialData } = usePos();

  const mattressDim = detectMattressDimensions(product?.name || "", product?.category || "");
  const baseProductPrice = Number(product.price) || 0;
  const baseMinimumPrice = Number(product.minimumPrice) || 0;

  // Estados de Personalização
  const [selectedFoam, setSelectedFoam] = useState(EXTRA_FOAM_OPTIONS[0]);
  const [selectedTopFabric, setSelectedTopFabric] = useState(TOP_FABRIC_OPTIONS[0]);
  const [customTopFabricName, setCustomTopFabricName] = useState("");

  const [selectedFabricColor, setSelectedFabricColor] = useState(SET_FABRIC_COLORS[0]);
  const [customFabricColorName, setCustomFabricColorName] = useState("");

  const [selectedFitilho, setSelectedFitilho] = useState(FITILHO_OPTIONS[0]);
  const [customFitilhoName, setCustomFitilhoName] = useState("");

  const [selectedFeet, setSelectedFeet] = useState(BOX_FEET_OPTIONS[0]);

  const [quantity, setQuantity] = useState(1);
  const activeFoamPricing = getExtraFoamPricing(selectedFoam.id, mattressDim.sizeKey);
  const suggestedUnitPrice = baseProductPrice + activeFoamPricing.additionalPrice;
  const recommendedMinimumPrice = baseMinimumPrice > 0 ? (baseMinimumPrice + activeFoamPricing.minimumFloorPrice) : 0;

  const [unitPrice, setUnitPrice] = useState<number>(suggestedUnitPrice);
  const [technicalNotes, setTechnicalNotes] = useState("");

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleFoamChange = (foam: typeof EXTRA_FOAM_OPTIONS[0]) => {
    setSelectedFoam(foam);
    const newPricing = getExtraFoamPricing(foam.id, mattressDim.sizeKey);
    setUnitPrice(baseProductPrice + newPricing.additionalPrice);
  };

  const handleSubmit = () => {
    const finalTopFabric = customTopFabricName.trim() ? customTopFabricName.trim() : selectedTopFabric.name;
    const finalFabricColor = customFabricColorName.trim() ? customFabricColorName.trim() : selectedFabricColor.name;
    const finalFitilhoColor = customFitilhoName.trim()
      ? customFitilhoName.trim()
      : (selectedFitilho.id === "tom_sobre_tom" ? `Tom sobre Tom (${finalFabricColor})` : selectedFitilho.name);

    const details = {
      // Colchão
      topFabricName: finalTopFabric,
      extraFoamId: selectedFoam.id,
      extraFoamName: selectedFoam.name,
      extraFoamHeight: selectedFoam.height,
      extraFoamPrice: activeFoamPricing.additionalPrice,
      extraFoamCost: activeFoamPricing.directCost,

      // Box
      feetType: selectedFeet.name,
      hasFeet: selectedFeet.id !== "sem_pes",

      // Harmonização Conjunto
      sideFabricColor: finalFabricColor,
      boxFabricColor: finalFabricColor,
      fabricColorHex: selectedFabricColor.hex,
      fitilhoColor: finalFitilhoColor,
      fitilhoType: selectedFitilho.name,

      // Observações
      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: `Colchão: ${selectedFoam.badge} • Tampo: ${finalTopFabric} | Box: ${selectedFeet.badge} | Tecido: ${finalFabricColor}`,
      minimumFloorPrice: recommendedMinimumPrice,
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        {/* Cabeçalho do Conjunto */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Personalização de Conjunto Completo
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-200">
              <Layers className="h-3 w-3 text-blue-600" />
              <span>Colchão + Cama Box Harmonizados</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Personalize individualmente o Colchão (espuma e tampo) e a Cama Box (pés), com revestimento coordenado.
          </p>
        </div>

        {/* 1. SEÇÃO DO COLCHÃO: CAMADA EXTRA DE ESPUMA (PILLOW TOP) */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">1. Colchão: Camada Extra de Espuma (Pillow Top)</h4>
                <p className="text-[11px] text-slate-500">Exclusivo do colchão • Densidade e conforto postural</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXTRA_FOAM_OPTIONS.map((opt) => {
              const isSelected = selectedFoam.id === opt.id;
              const pricing = getExtraFoamPricing(opt.id, mattressDim.sizeKey);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleFoamChange(opt)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-blue-600 bg-white shadow-sm ring-2 ring-blue-600/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {opt.badge}
                    </span>
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{opt.name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                  {pricing.additionalPrice > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 block mt-1.5">
                      +{formatBRL(pricing.additionalPrice)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tecido do Tampo do Colchão */}
          <div className="pt-3 border-t border-blue-200/60">
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Tecido do Tampo Superior do Colchão:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TOP_FABRIC_OPTIONS.map((top) => {
                const isSelected = selectedTopFabric.id === top.id;
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => setSelectedTopFabric(top)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-blue-600 bg-white font-bold text-blue-900 shadow-sm ring-1 ring-blue-600/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs leading-tight">{top.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. SEÇÃO DA CAMA BOX: PÉS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600">
              <Footprints className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">2. Cama Box: Modelo dos Pés</h4>
              <p className="text-[11px] text-slate-500">Exclusivo do box • Altura, rodízios e material</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {BOX_FEET_OPTIONS.map((feet) => {
              const isSelected = selectedFeet.id === feet.id;
              return (
                <button
                  key={feet.id}
                  type="button"
                  onClick={() => setSelectedFeet(feet)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600/30"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white"
                  }`}
                >
                  <span className="text-[9px] font-bold text-emerald-700 block uppercase tracking-wider mb-1">
                    {feet.badge}
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{feet.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. REVESTIMENTO COORDENADO: VELUDO E FITILHO */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">3. Revestimento Coordenado (Laterais do Colchão & Box)</h4>
              <p className="text-[11px] text-slate-500">Cartela oficial de veludos nobres Spa do Colchão</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SET_FABRIC_COLORS.map((c) => {
              const isSelected = selectedFabricColor.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedFabricColor(c)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span
                    className="h-6 w-6 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-bold text-slate-800 truncate">{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Fitilho de Acabamento */}
          <div className="pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Fitilho de Debrum:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FITILHO_OPTIONS.map((fit) => {
                const isSelected = selectedFitilho.id === fit.id;
                return (
                  <button
                    key={fit.id}
                    type="button"
                    onClick={() => setSelectedFitilho(fit)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 font-bold text-primary shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs leading-tight">{fit.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. QUANTIDADE E PREÇO NEGOCIADO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Quantidade de Conjuntos
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 hover:bg-slate-100"
              >
                -
              </button>
              <span className="font-outfit text-2xl font-black text-slate-900 w-12 text-center tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Preço Unitário Negociado (R$)
              </label>
              {unitPrice !== suggestedUnitPrice && (
                <button
                  type="button"
                  onClick={() => setUnitPrice(suggestedUnitPrice)}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  Sugerido: {formatBRL(suggestedUnitPrice)}
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 font-outfit text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums"
            />
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Base: {formatBRL(baseProductPrice)}</span>
              {activeFoamPricing.additionalPrice > 0 && (
                <span className="text-emerald-700 font-bold">Espuma Colchão: +{formatBRL(activeFoamPricing.additionalPrice)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Observações Técnicas / Negociação
          </label>
          <input
            type="text"
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Ex: Entregar com capa plástica dupla, cliente solicitou pés extras..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Barra de Ações Inferior */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 max-w-xs px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-center"
        >
          Adicionar Conjunto ({formatBRL(unitPrice * quantity)})
        </button>
      </div>
    </div>
  );
}
