"use client";

import { useState } from "react";
import { Check, Sparkles, Layers, Footprints, Palette, Ribbon, Activity, Info } from "lucide-react";
import { usePos } from "../PosContext";
import {
  detectMattressDimensions,
  getExtraFoamPricing,
  VIBRO_CONVERSION_PRICE,
  VIBRO_CONVERSION_COST,
} from "@/lib/pricing/foam-pricing";

interface SetCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// 1. Camada Extra de Espuma para o Colchão do Conjunto (EXCLUSIVAMENTE 5 CM - REFORMAS E NOVOS)
const EXTRA_FOAM_OPTIONS = [
  {
    id: "sem_extra",
    code: null,
    height: 0,
    name: "Sem Camada Extra (0 cm)",
    badge: "Padrão",
    desc: "Mantém a estrutura original da ficha técnica do colchão",
  },
  {
    id: "extra_d33_5cm",
    code: "INS-ESP-D33",
    height: 5,
    name: "Camada Adicional +5cm Espuma Conforto",
    badge: "+5cm Conforto",
    desc: "Lâmina inteiriça de 5cm para conforto macio e acolhedor",
  },
  {
    id: "extra_r26_5cm",
    code: "INS-ESP-R26-5CM",
    height: 5,
    name: "Camada Adicional +5cm Espuma Firme (Ortopédica)",
    badge: "+5cm Firme",
    desc: "Lâmina inteiriça de 5cm de alta sustentação para firmeza postural",
  },
];

// 2. Tecido do Tampo Superior do Colchão
const TOP_FABRIC_OPTIONS = [
  {
    id: "matelasse_branco",
    code: "INS-TEC-MAT",
    name: "Matelassê Branco Acolchoado",
    desc: "Padrão de Fábrica • Máximo frescor e acolchoamento nobre",
    badge: "Padrão",
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

// 3. Tampo de Baixo do Colchão (Reforma)
const BOTTOM_FABRIC_OPTIONS = [
  {
    id: "tnt_antiderrapante_preto",
    code: "INS-TEC-TNT",
    name: "TNT Antiderrapante Preto 100g/150g",
    desc: "Padrão 1 Face • Aderência perfeita com a base do box",
    badge: "Padrão 1 Face",
  },
  {
    id: "matelasse_branco_dupla_face",
    code: "INS-TEC-MAT",
    name: "Matelassê Branco Acolchoado (Dupla Face)",
    desc: "Transforma o colchão em dupla face giratório para ambos os lados",
    badge: "Dupla Face",
  },
  {
    id: "matelasse_bege_dupla_face",
    code: "INS-TEC-MAT",
    name: "Matelassê Bege Linho (Dupla Face)",
    desc: "Acabamento acolchoado duplo em tom bege",
    badge: "Dupla Face",
  },
  {
    id: "mesmo_veludo_lateral",
    code: "INS-TEC-VEL",
    name: "Mesmo Tecido da Faixa Lateral",
    desc: "Revestimento inferior no mesmo veludo lateral",
    badge: "Monocromático",
  },
];

// 4. TNT de Cima do Box
const BOX_TOP_TNT_OPTIONS = [
  {
    id: "tnt_preto_antiderrapante",
    code: "INS-TEC-TNT",
    name: "TNT Antiderrapante Preto 100g/150g",
    desc: "Padrão • Máxima aderência para fixar o colchão sem deslizar",
    badge: "Padrão",
  },
  {
    id: "tnt_branco",
    code: "INS-TEC-TNT",
    name: "TNT Branco Reforçado",
    desc: "Superfície clara",
    badge: "Claro",
  },
  {
    id: "tnt_bege",
    code: "INS-TEC-TNT",
    name: "TNT Bege Linho Reforçado",
    desc: "Superfície neutra elegante",
    badge: "Neutro",
  },
];

// 5. Cartela de Cores de Tecido para as Faixas Laterais do Colchão e Forragem do Box
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

// 6. Fitilhos de Fechamento do Colchão (Reforma)
const FITILHO_OPTIONS = [
  {
    id: "tom_sobre_tom",
    code: "INS-FIT-035",
    name: "Fitilho Tom sobre Tom",
    desc: "Mesma cor do veludo para acabamento contínuo e elegante",
    badge: "Harmônico",
  },
  {
    id: "fitilho_branco",
    code: "INS-FIT-035",
    name: "Fitilho Branco Clássico",
    desc: "Fitim debrum padrão para contraste iluminado",
    badge: "Padrão",
  },
  {
    id: "fitilho_bege",
    code: "INS-FIT-035",
    name: "Fitilho Bege Linho",
    desc: "Borda suave combinando com tecidos areia",
    badge: "Suave",
  },
  {
    id: "fitilho_grafite",
    code: "INS-FIT-035",
    name: "Fitilho Cinza Grafite",
    desc: "Tom sóbrio e moderno",
    badge: "Sóbrio",
  },
  {
    id: "fitilho_preto",
    code: "INS-FIT-035",
    name: "Fitilho Preto Ônix",
    desc: "Destaque marcante e alta presença",
    badge: "Marcante",
  },
];

// 7. Opções de Pés do Box
const BOX_FEET_OPTIONS = [
  {
    id: "pe_12_madeira",
    code: "INS-PE-MAD-12",
    name: "Pé Madeira Maciça 12cm Tabaco",
    badge: "Padrão",
    desc: "Madeira maciça torneada com sapata de proteção",
  },
  {
    id: "pe_12_mel",
    code: "INS-PE-MAD-12",
    name: "Pé Madeira Maciça 12cm Mel",
    badge: "Madeira Clara",
    desc: "Tom amadeirado natural elegante",
  },
  {
    id: "pe_12_preto",
    code: "INS-PE-PLA-12",
    name: "Pé Plástico 12cm Preto",
    badge: "Resistente",
    desc: "Injetado de alta densidade",
  },
  {
    id: "pe_aluminio",
    code: "INS-PE-ALU-12",
    name: "Pé Alumínio Cromado 12cm",
    badge: "Cromado",
    desc: "Visual metálico contemporâneo",
  },
  {
    id: "pe_rodizio",
    code: "INS-PE-ROD-12",
    name: "Pés c/ Rodízio Móvel",
    badge: "Com Rodízio",
    desc: "2 pés com rodízios de giro livre e trava",
  },
  {
    id: "sem_pes",
    code: null,
    name: "Sem Pés / Reutilizar do Cliente",
    badge: "Sem Custo",
    desc: "Para cama embutida ou pés já existentes",
  },
];

export function SetCustomizationForm({
  product,
  onAdd,
  onCancel,
}: SetCustomizationFormProps) {
  const { initialData } = usePos();

  const isReforma =
    (product?.name || "").toLowerCase().includes("reforma") ||
    (product?.category || "").toLowerCase().includes("reforma") ||
    (product?.operationalCategory || "").toLowerCase().includes("reforma");

  const mattressDim = detectMattressDimensions(product?.name || "", product?.category || "");
  const baseProductPrice = Number(product.price) || 0;
  const baseMinimumPrice = Number(product.minimumPrice) || 0;

  // Estados de Personalização
  // COLCHÃO:
  const [selectedTopFabric, setSelectedTopFabric] = useState(TOP_FABRIC_OPTIONS[0]);
  const [customTopFabricName, setCustomTopFabricName] = useState("");

  const [selectedBottomFabric, setSelectedBottomFabric] = useState(BOTTOM_FABRIC_OPTIONS[0]);
  const [customBottomFabricName, setCustomBottomFabricName] = useState("");

  const [selectedSideColor, setSelectedSideColor] = useState(SET_FABRIC_COLORS[0]);
  const [customSideColorName, setCustomSideColorName] = useState("");

  const [selectedFitilho, setSelectedFitilho] = useState(FITILHO_OPTIONS[0]);
  const [customFitilhoName, setCustomFitilhoName] = useState("");

  const [selectedFoam, setSelectedFoam] = useState(EXTRA_FOAM_OPTIONS[0]);
  const [customFoamNotes, setCustomFoamNotes] = useState("");

  const [hasVibroConversion, setHasVibroConversion] = useState(false);

  // BOX:
  const [selectedTopTNT, setSelectedTopTNT] = useState(BOX_TOP_TNT_OPTIONS[0]);
  const [customTopTNTName, setCustomTopTNTName] = useState("");

  const [selectedFeet, setSelectedFeet] = useState(BOX_FEET_OPTIONS[0]);
  const [customFeetName, setCustomFeetName] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [technicalNotes, setTechnicalNotes] = useState("");

  // Cálculos de Preço Adicional (Camada de espuma disponível para reformas e conjuntos novos)
  const activeFoamPricing = getExtraFoamPricing(selectedFoam.id, mattressDim.sizeKey);

  const vibroPrice = isReforma && hasVibroConversion ? VIBRO_CONVERSION_PRICE : 0;
  const vibroCost = isReforma && hasVibroConversion ? VIBRO_CONVERSION_COST : 0;

  const totalExtraPrice = activeFoamPricing.additionalPrice + vibroPrice;
  const suggestedUnitPrice = baseProductPrice + totalExtraPrice;
  const recommendedMinimumPrice =
    baseMinimumPrice > 0 ? baseMinimumPrice + activeFoamPricing.minimumFloorPrice + vibroCost : 0;

  const [unitPrice, setUnitPrice] = useState<number>(suggestedUnitPrice);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mapear insumos do estoque
  const supplyItems = initialData?.supplyItems || [];
  const veludoSupply = supplyItems.find(
    (s: any) => s.code === "INS-TEC-VEL" || s.name?.toLowerCase().includes("veludo")
  );
  const matelasseSupply = supplyItems.find(
    (s: any) => s.code === "INS-TEC-MAT" || s.name?.toLowerCase().includes("matelassê")
  );
  const feetSupply = selectedFeet.code
    ? supplyItems.find((s: any) => s.code === selectedFeet.code)
    : null;

  const handleSelectFoam = (f: typeof EXTRA_FOAM_OPTIONS[0]) => {
    const oldPricing = getExtraFoamPricing(selectedFoam.id, mattressDim.sizeKey);
    const newPricing = getExtraFoamPricing(f.id, mattressDim.sizeKey);
    const diff = newPricing.additionalPrice - oldPricing.additionalPrice;
    setSelectedFoam(f);
    setUnitPrice((prev) => Math.max(0, prev + diff));
  };

  const handleToggleVibro = (active: boolean) => {
    if (active === hasVibroConversion) return;
    setHasVibroConversion(active);
    const diff = active ? VIBRO_CONVERSION_PRICE : -VIBRO_CONVERSION_PRICE;
    setUnitPrice((prev) => Math.max(0, prev + diff));
  };

  const handleSubmit = () => {
    const finalTopName = customTopFabricName.trim() ? customTopFabricName.trim() : selectedTopFabric.name;
    const finalBottomName = customBottomFabricName.trim() ? customBottomFabricName.trim() : selectedBottomFabric.name;
    const finalSideName = customSideColorName.trim() ? customSideColorName.trim() : selectedSideColor.name;
    const finalFitilhoName = customFitilhoName.trim()
      ? customFitilhoName.trim()
      : selectedFitilho.id === "tom_sobre_tom"
      ? `Tom sobre Tom (${finalSideName})`
      : selectedFitilho.name;
    const finalFoamName = customFoamNotes.trim() ? `${selectedFoam.name} (${customFoamNotes.trim()})` : selectedFoam.name;
    const finalTopTNTName = customTopTNTName.trim() ? customTopTNTName.trim() : selectedTopTNT.name;
    const finalFeetName = customFeetName.trim() ? customFeetName.trim() : selectedFeet.name;

    const summaryParts = [
      `[Colchão] Tampo: ${finalTopName}`,
      isReforma ? `Fundo: ${finalBottomName}` : null,
      `Faixa: ${finalSideName}`,
      isReforma ? `Fitilho: ${finalFitilhoName}` : null,
      selectedFoam.id !== "sem_extra" ? `Espuma: ${finalFoamName} (${activeFoamPricing.priceBadge})` : null,
      isReforma && hasVibroConversion ? `Vibro: Ativo (+${formatBRL(VIBRO_CONVERSION_PRICE)})` : null,
      `[Box] TNT: ${finalTopTNTName}`,
      `Forragem: ${finalSideName}`,
      `Pés: ${finalFeetName}`,
    ].filter(Boolean);

    const details = {
      isReforma,
      isConjunto: true,

      // COLCHÃO:
      topFabricColor: finalTopName,
      topColor: finalTopName,
      topFabricId: matelasseSupply?.id || null,
      bottomFabricColor: isReforma ? finalBottomName : null,
      sideFabricColor: finalSideName,
      sideColor: finalSideName,
      fabricColorHex: selectedSideColor.hex,
      fitilhoColor: isReforma ? finalFitilhoName : null,
      extraFoamOption: selectedFoam.id !== "sem_extra" ? finalFoamName : "Padrão de Fábrica",
      hasExtraFoam: selectedFoam.id !== "sem_extra",
      addedFoamHeight: selectedFoam.id !== "sem_extra" ? selectedFoam.height : 0,
      extraFoamPrice: activeFoamPricing.additionalPrice,
      extraFoamCost: activeFoamPricing.directCost,
      foamVolumeM3: activeFoamPricing.volumeM3,
      hasVibroConversion: isReforma && hasVibroConversion,
      vibroPrice: isReforma && hasVibroConversion ? VIBRO_CONVERSION_PRICE : 0,

      // BOX:
      boxTopTNT: finalTopTNTName,
      boxFabricColor: finalSideName,
      hasFeet: selectedFeet.id !== "sem_pes",
      feetType: finalFeetName,
      feetSupplyItemId: feetSupply?.id || null,

      // Dimensões
      mattressSize: mattressDim.sizeKey,
      commercialSize: mattressDim.sizeKey.toLowerCase(),

      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: summaryParts.join(" • "),
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        {/* Cabeçalho do Conjunto */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isReforma ? "Reforma de Conjunto (Colchão + Box)" : "Conjunto Novo (Colchão + Box)"}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                {mattressDim.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-200">
              <Layers className="h-3 w-3 text-blue-600" />
              <span>Colchão + Box Combinados</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Personalização do Conjunto Completo. As espumas aplicam-se exclusivamente ao colchão (Box não leva espuma).
          </p>
        </div>

        {/* ALERTA SE FOR NOVO */}
        {!isReforma && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-start gap-2.5 text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Padrão da Linha Homologado:</strong> A estrutura e camadas do colchão e box seguem o padrão oficial deste conjunto novo. Personalize abaixo as opções de tecido da superfície, faixa lateral e pezinhos.
            </p>
          </div>
        )}

        {/* SEÇÃO 1: PERSONALIZAÇÃO DO COLCHÃO */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/20 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
              1
            </div>
            <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider">
              Personalização do Colchão
            </h4>
          </div>

          {/* Tampo de Cima do Colchão */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Tampo de Cima (Superfície Superior):</label>
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                {customTopFabricName.trim() ? customTopFabricName : selectedTopFabric.name}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{tf.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{tf.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tampo de Baixo do Colchão (Apenas Reforma) */}
          {isReforma && (
            <div className="space-y-2 pt-2 border-t border-blue-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Tampo de Baixo (Superfície Inferior):</label>
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                  {customBottomFabricName.trim() ? customBottomFabricName : selectedBottomFabric.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BOTTOM_FABRIC_OPTIONS.map((bf) => {
                  const isSelected = selectedBottomFabric.id === bf.id && !customBottomFabricName.trim();
                  return (
                    <button
                      key={bf.id}
                      type="button"
                      onClick={() => {
                        setSelectedBottomFabric(bf);
                        setCustomBottomFabricName("");
                      }}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 leading-tight">{bf.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{bf.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fitilho de Fechamento do Colchão (Apenas Reforma) */}
          {isReforma && (
            <div className="space-y-2 pt-2 border-t border-blue-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Fitilho de Fechamento (Debrum):</label>
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                  {customFitilhoName.trim() ? customFitilhoName : selectedFitilho.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FITILHO_OPTIONS.map((fit) => {
                  const isSelected = selectedFitilho.id === fit.id && !customFitilhoName.trim();
                  return (
                    <button
                      key={fit.id}
                      type="button"
                      onClick={() => {
                        setSelectedFitilho(fit);
                        setCustomFitilhoName("");
                      }}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 leading-tight">{fit.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Camada Adicional de Espuma no Colchão (Disponível para Conjunto Novo e Reforma - Só 5cm) */}
          <div className="space-y-2 pt-2 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Camada Adicional de Espuma no Colchão (Apenas 5cm):</label>
              <span className="text-[11px] font-bold text-emerald-700">{selectedFoam.badge}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {EXTRA_FOAM_OPTIONS.map((f) => {
                const isSelected = selectedFoam.id === f.id;
                const fPricing = getExtraFoamPricing(f.id, mattressDim.sizeKey);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFoam(f)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div
                        className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                      </div>
                      <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                        {fPricing.priceBadge}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{f.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conversão para Vibroterapia (Apenas Reforma) */}
          {isReforma && (
            <div className="space-y-2 pt-2 border-t border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-purple-600" />
                  <label className="text-xs font-bold text-slate-700">Conversão para Vibroterapia no Colchão:</label>
                </div>
                <span className="text-[11px] font-bold text-purple-700">
                  {hasVibroConversion ? `+ ${formatBRL(VIBRO_CONVERSION_PRICE)}` : "Não Converter"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVibro(false)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    !hasVibroConversion
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">Manter Tradicional (+R$ 0)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleVibro(true)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    hasVibroConversion
                      ? "border-purple-600 bg-purple-50 ring-2 ring-purple-500/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold text-purple-900">
                    Converter para Vibroterapia (+{formatBRL(VIBRO_CONVERSION_PRICE)})
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: TECIDO DAS FAIXAS LATERAIS (VELUDO DO CONJUNTO) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tecido Lateral do Conjunto (Veludo / Suede)</h4>
                <p className="text-[11px] text-slate-500">Revestimento unificado das faixas do colchão e da forragem do box</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-black text-primary">
              {customSideColorName.trim() ? customSideColorName : selectedSideColor.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {SET_FABRIC_COLORS.map((c) => {
              const isSelected = selectedSideColor.id === c.id && !customSideColorName.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedSideColor(c);
                    setCustomSideColorName("");
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white"
                  }`}
                >
                  <div
                    className="h-5 w-5 rounded-lg border border-black/10 shrink-0 shadow-xs flex items-center justify-center"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`h-3 w-3 stroke-[3] ${c.isLight ? "text-slate-900" : "text-white"}`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">{c.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEÇÃO 3: PERSONALIZAÇÃO DO BOX DO CONJUNTO */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs">
              2
            </div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider">
              Personalização do Box do Conjunto
            </h4>
          </div>

          {/* TNT de Cima do Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">TNT de Cima do Box (Apoio Antiderrapante):</label>
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                {customTopTNTName.trim() ? customTopTNTName : selectedTopTNT.name}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {BOX_TOP_TNT_OPTIONS.map((tnt) => {
                const isSelected = selectedTopTNT.id === tnt.id && !customTopTNTName.trim();
                return (
                  <button
                    key={tnt.id}
                    type="button"
                    onClick={() => {
                      setSelectedTopTNT(tnt);
                      setCustomTopTNTName("");
                    }}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{tnt.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pezinhos do Box */}
          <div className="space-y-2 pt-2 border-t border-amber-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Pezinhos do Box:</label>
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                {customFeetName.trim() ? customFeetName : selectedFeet.name}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BOX_FEET_OPTIONS.map((foot) => {
                const isSelected = selectedFeet.id === foot.id && !customFeetName.trim();
                return (
                  <button
                    key={foot.id}
                    type="button"
                    onClick={() => {
                      setSelectedFeet(foot);
                      setCustomFeetName("");
                    }}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-tight">{foot.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{foot.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Observações Técnicas */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700">
            Observações Técnicas para Produção
          </label>
          <textarea
            rows={2}
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Instruções adicionais de acabamento do colchão ou reforço do box..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Barra Inferior com Quantidade e Preço Unitário Negociável */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 border-t border-slate-200/80 bg-white/95 p-4 sm:p-6 backdrop-blur-md shadow-lg rounded-b-3xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {/* Quantidade */}
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-lg hover:bg-white flex items-center justify-center font-black text-slate-600 transition-colors"
              >
                -
              </button>
              <span className="w-9 text-center font-bold text-sm text-slate-800">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-8 w-8 rounded-lg hover:bg-white flex items-center justify-center font-black text-slate-600 transition-colors"
              >
                +
              </button>
            </div>

            {/* Preço Unitário Negociável */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Preço Unitário (R$)</span>
                {totalExtraPrice > 0 && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    +{formatBRL(totalExtraPrice)} adicionais
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="10"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                  className="w-28 text-base font-black text-slate-900 border-b border-dashed border-slate-300 focus:border-primary focus:outline-none bg-transparent"
                />
              </div>
              {unitPrice < suggestedUnitPrice && (
                <p className="text-[10px] font-bold text-amber-600">
                  Desconto: -{formatBRL(suggestedUnitPrice - unitPrice)}
                </p>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/25 hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
            >
              <span>Adicionar ao Carrinho</span>
              <span className="text-white/80">•</span>
              <span>{formatBRL(unitPrice * quantity)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
