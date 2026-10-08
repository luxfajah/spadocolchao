"use client";

import { useState } from "react";
import { Check, Sparkles, Layers, Palette, Ribbon, PlusCircle } from "lucide-react";
import { usePos } from "../PosContext";

interface MattressCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// 1. Opções de Camada Extra de Espuma (Pillow Top / Conforto)
const EXTRA_FOAM_OPTIONS = [
  {
    id: "sem_extra",
    code: null,
    height: 0,
    name: "Sem Camada Extra (Padrão de Fábrica)",
    badge: "Padrão",
    desc: "Mantém a densidade e estrutura original da ficha técnica do modelo",
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

// 2. Opções de Tecido do Tampo Superior (Superfície de Contato)
const TOP_FABRIC_OPTIONS = [
  {
    id: "matelasse_branco",
    code: "INS-TEC-MAT",
    name: "Matelassê Branco Acolchoado",
    desc: "Padrão de Fábrica • Máximo frescor, toque suave e acolchoamento nobre",
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
    desc: "Alta proteção contra manchas e visual moderno contemporâneo",
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

// 3. Cartela de Cores de Tecido da Faixa Lateral (Veludo)
const SIDE_FABRIC_COLORS = [
  { id: "bege", name: "Bege Areia", hex: "#D4C4B5", desc: "Clássico, neutro e suave", isLight: true },
  { id: "grafite", name: "Cinza Grafite", hex: "#4A4E51", desc: "Moderno e sofisticado", isLight: false },
  { id: "preto", name: "Preto Ônix", hex: "#1A1A1A", desc: "Elegante e resistente a marcas", isLight: false },
  { id: "marrom", name: "Marrom Café", hex: "#5A3825", desc: "Rústico e acolhedor", isLight: false },
  { id: "marinho", name: "Azul Marinho", hex: "#1B2A4A", desc: "Tom nobre e contemporâneo", isLight: false },
  { id: "cinza", name: "Cinza Prata", hex: "#A9ACB0", desc: "Iluminado e acetinado", isLight: true },
  { id: "offwhite", name: "Off-White Pérola", hex: "#EDEBE6", desc: "Requinte e sofisticação", isLight: true },
  { id: "bordo", name: "Bordô Vinho", hex: "#5E1926", desc: "Personalidade marcante", isLight: false },
];

// 4. Opções de Fitilho de Fechamento (Debrum)
const FITILHO_OPTIONS = [
  {
    id: "tom_sobre_tom",
    code: "INS-FIT-035",
    name: "Fitilho Tom sobre Tom",
    desc: "Mesma tonalidade da faixa lateral para acabamento contínuo",
    badge: "Harmônico",
  },
  {
    id: "fitilho_branco",
    code: "INS-FIT-035",
    name: "Fitilho Branco Clássico",
    desc: "Fitim 35mm clássico iluminando o fechamento do tampo",
    badge: "Padrão",
  },
  {
    id: "fitilho_bege",
    code: "INS-FIT-035",
    name: "Fitilho Bege Linho",
    desc: "Borda suave combinando com tampos areia",
    badge: "Suave",
  },
  {
    id: "fitilho_grafite",
    code: "INS-FIT-035",
    name: "Fitilho Cinza Grafite",
    desc: "Tom escuro para elegância contemporânea",
    badge: "Sóbrio",
  },
  {
    id: "fitilho_preto",
    code: "INS-FIT-035",
    name: "Fitilho Preto Ônix",
    desc: "Borda marcante de alta presença visual",
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

export function MattressCustomizationForm({
  product,
  onAdd,
  onCancel,
}: MattressCustomizationFormProps) {
  const { initialData } = usePos();

  // Estados de Personalização do Colchão
  const [selectedFoam, setSelectedFoam] = useState(EXTRA_FOAM_OPTIONS[0]);
  const [customFoamNotes, setCustomFoamNotes] = useState("");

  const [selectedTopFabric, setSelectedTopFabric] = useState(TOP_FABRIC_OPTIONS[0]);
  const [customTopFabricName, setCustomTopFabricName] = useState("");

  const [selectedSideColor, setSelectedSideColor] = useState(SIDE_FABRIC_COLORS[0]);
  const [customSideColorName, setCustomSideColorName] = useState("");

  const [selectedFitilho, setSelectedFitilho] = useState(FITILHO_OPTIONS[0]);
  const [customFitilhoName, setCustomFitilhoName] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(product.price || 0);
  const [technicalNotes, setTechnicalNotes] = useState("");

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mapear insumos do estoque
  const supplyItems = initialData?.supplyItems || [];
  const veludoSupply = supplyItems.find((s: any) => s.code === "INS-TEC-VEL" || s.name?.toLowerCase().includes("veludo"));
  const matelasseSupply = supplyItems.find((s: any) => s.code === "INS-TEC-MAT" || s.name?.toLowerCase().includes("matelassê"));
  const fitilhoPadraoSupply = supplyItems.find((s: any) => s.code === "INS-FIT-035");
  const fitilhoColmeiaSupply = supplyItems.find((s: any) => s.code === "INS-FIT-COL");
  const foamSupply = selectedFoam.code ? supplyItems.find((s: any) => s.code === selectedFoam.code) : null;

  const handleSubmit = () => {
    const finalTopName = customTopFabricName.trim() ? customTopFabricName.trim() : selectedTopFabric.name;
    const finalSideName = customSideColorName.trim() ? customSideColorName.trim() : selectedSideColor.name;
    const finalFitilhoName = customFitilhoName.trim()
      ? customFitilhoName.trim()
      : (selectedFitilho.id === "tom_sobre_tom" ? `Tom sobre Tom (${finalSideName})` : selectedFitilho.name);
    const finalFoamName = customFoamNotes.trim() ? `${selectedFoam.name} (${customFoamNotes.trim()})` : selectedFoam.name;

    const details = {
      // 1. Tampo
      topFabricColor: finalTopName,
      topColor: finalTopName,
      topFabricId: matelasseSupply?.id || null,

      // 2. Faixa Lateral
      sideFabricColor: finalSideName,
      sideColor: finalSideName,
      sideFabricId: veludoSupply?.id || null,
      fabricColorHex: selectedSideColor.hex,

      // 3. Fitilho
      fitilhoColor: finalFitilhoName,
      fitilhoType: selectedFitilho.name,
      fitilhoSupplyItemId: selectedFitilho.code === "INS-FIT-COL" ? fitilhoColmeiaSupply?.id : fitilhoPadraoSupply?.id,

      // 4. Camada Extra de Espuma
      extraFoamOption: finalFoamName,
      extraFoamSupplyItemId: foamSupply?.id || null,
      hasExtraFoam: selectedFoam.id !== "sem_extra",
      addedFoamHeight: selectedFoam.height,

      // Colchões não têm pés
      hasFeet: false,
      feetType: null,
      feetSupplyItemId: null,

      // Observações e Resumo de Engenharia
      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: `Tampo: ${finalTopName} • Faixa: ${finalSideName} • Fitilho: ${finalFitilhoName} • Espuma: ${finalFoamName}`,
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        
        {/* Cabeçalho do Colchão */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Personalização de Colchão
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <Layers className="h-3 w-3 text-emerald-600" />
              <span>Ficha Técnica Automática</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Linha: <strong className="text-slate-700">{product.category}</strong> • Molas, espumas base e estrutura já inclusas na ficha.
          </p>
        </div>

        {/* 1. SELEÇÃO DA CAMADA EXTRA DE ESPUMA */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <PlusCircle className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Camada Extra de Espuma (Pillow Top)</h4>
                <p className="text-[11px] text-slate-500">Adicione conforto extra ou sustentação ortopédica</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
              {selectedFoam.badge}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {EXTRA_FOAM_OPTIONS.map((f) => {
              const isSelected = selectedFoam.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFoam(f)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{f.name}</p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {f.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{f.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedFoam.id !== "sem_extra" && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Especificação da espuma:</span>
              <input
                type="text"
                placeholder="Ex: Pillow embutido Europillow, espuma D33 especial, etc..."
                value={customFoamNotes}
                onChange={(e) => setCustomFoamNotes(e.target.value)}
                className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* 2. SELEÇÃO DO TECIDO DO TAMPO SUPERIOR */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tecido do Tampo (Superfície Superior)</h4>
                <p className="text-[11px] text-slate-500">Escolha o padrão de matelassê e acolchoamento do tampo</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
              {customTopFabricName.trim() ? customTopFabricName : selectedTopFabric.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {TOP_FABRIC_OPTIONS.map((tf) => {
              const isSelected = selectedTopFabric.id === tf.id && !customTopFabricName.trim();
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => {
                    setSelectedTopFabric(tf);
                    setCustomTopFabricName("");
                  }}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{tf.name}</p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {tf.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{tf.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro tampo:</span>
            <input
              type="text"
              placeholder="Digite se o cliente escolheu matelassê sob encomenda..."
              value={customTopFabricName}
              onChange={(e) => setCustomTopFabricName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 3. SELEÇÃO DA COR DO TECIDO LATERAL (VELUDO DA FAIXA) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tecido Lateral (Faixa de Veludo)</h4>
                <p className="text-[11px] text-slate-500">Escolha a cor do revestimento lateral do colchão</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-black text-primary">
              {customSideColorName.trim() ? customSideColorName : selectedSideColor.name}
            </span>
          </div>

          {/* Grid de Cores da Faixa Lateral */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {SIDE_FABRIC_COLORS.map((c) => {
              const isSelected = selectedSideColor.id === c.id && !customSideColorName.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedSideColor(c);
                    setCustomSideColorName("");
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

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outra cor:</span>
            <input
              type="text"
              placeholder="Digite se o cliente escolheu veludo especial fora do mostruário..."
              value={customSideColorName}
              onChange={(e) => setCustomSideColorName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 4. SELEÇÃO DOS FITILHOS (DEBRUM DE FECHAMENTO) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Ribbon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Fitilhos de Fechamento (Debrum)</h4>
                <p className="text-[11px] text-slate-500">Defina o cordão debrum que fecha o tampo à faixa lateral</p>
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

        {/* 5. QUANTIDADE, PREÇO E OBSERVAÇÕES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Quantidade de Colchões
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

        {/* Observações de Produção */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            Observações Técnicas / Entrega (Opcional)
          </label>
          <input
            type="text"
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Ex: Embalagem reforçada, entregar pela manhã, etc..."
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Card Resumo do Colchão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-900 text-white p-4 sm:p-5 shadow-lg">
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Total do Item ({quantity} {quantity > 1 ? "peças" : "peça"})</p>
            <p className="font-outfit text-2xl font-black text-white tabular-nums tracking-tight">
              {formatBRL(unitPrice * quantity)}
            </p>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
            <p className="text-[11px] text-slate-200 font-bold">
              {customTopFabricName.trim() ? customTopFabricName : selectedTopFabric.name} • Faixa: {customSideColorName.trim() ? customSideColorName : selectedSideColor.name}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Fitilho: {customFitilhoName.trim() ? customFitilhoName : selectedFitilho.name} • {selectedFoam.badge}
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
          Adicionar Colchão ao Pedido
        </button>
      </div>
    </div>
  );
}
