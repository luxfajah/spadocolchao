"use client";

import { useState } from "react";
import { Check, Sparkles, Layers, Palette, Ribbon, PlusCircle, Activity, Info } from "lucide-react";
import { usePos } from "../PosContext";
import {
  detectMattressDimensions,
  getExtraFoamPricing,
  VIBRO_CONVERSION_PRICE,
  VIBRO_CONVERSION_COST,
} from "@/lib/pricing/foam-pricing";

interface MattressCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// 1. Opções de Camada Extra de Espuma para Reforma (EXCLUSIVAMENTE 5 CM)
const REFORM_EXTRA_FOAM_OPTIONS = [
  {
    id: "sem_extra",
    code: null,
    height: 0,
    name: "Sem Camada Extra (0 cm)",
    badge: "Padrão",
    desc: "Mantém a estrutura original do colchão sem acrescentar lâmina de espuma",
  },
  {
    id: "extra_d33_5cm",
    code: "INS-ESP-D33",
    height: 5,
    name: "Camada Adicional +5cm Espuma D-33 Conforto",
    badge: "+5cm Conforto",
    desc: "Lâmina inteiriça de 5cm de densidade D33 para conforto anatômico superior",
  },
  {
    id: "extra_r26_5cm",
    code: "INS-ESP-R26-5CM",
    height: 5,
    name: "Camada Adicional +5cm Ortopédica Firme (R-26)",
    badge: "+5cm Firme",
    desc: "Lâmina inteiriça de 5cm aglomerado de alta sustentação para firmeza postural",
  },
];

// 2. Opções de Tecido do Tampo Superior (Superfície de Contato)
const TOP_FABRIC_OPTIONS = [
  {
    id: "matelasse_branco",
    code: "INS-TEC-MAT",
    name: "Matelassê Branco Acolchoado",
    desc: "Padrão de Fábrica • Máximo frescor, toque suave e acolchoamento nobre",
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

// 3. Opções de Tampo de Baixo (Superfície Inferior - Exclusivo para Reforma)
const BOTTOM_FABRIC_OPTIONS = [
  {
    id: "tnt_antiderrapante_preto",
    code: "INS-TEC-TNT",
    name: "TNT Antiderrapante Preto 100g/150g",
    desc: "Padrão 1 Face • Máxima aderência na base e alta durabilidade",
    badge: "Padrão 1 Face",
  },
  {
    id: "matelasse_branco_dupla_face",
    code: "INS-TEC-MAT",
    name: "Matelassê Branco Acolchoado (Dupla Face)",
    desc: "Permite virar e utilizar o colchão dos dois lados",
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
    id: "tnt_bege",
    code: "INS-TEC-TNT",
    name: "TNT Bege Linho Reforçado",
    desc: "Fundo neutro claro para harmonizar com tecidos claros",
    badge: "Neutro",
  },
  {
    id: "mesmo_veludo_lateral",
    code: "INS-TEC-VEL",
    name: "Mesmo Tecido da Faixa Lateral",
    desc: "Revestimento inferior no mesmo veludo lateral",
    badge: "Monocromático",
  },
];

// 4. Cartela de Cores de Tecido da Faixa Lateral (Veludo / Suede)
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

// 5. Opções de Fitilho de Fechamento (Debrum - Exclusivo para Reforma)
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
];

export function MattressCustomizationForm({
  product,
  onAdd,
  onCancel,
}: MattressCustomizationFormProps) {
  const { initialData } = usePos();

  const isReforma =
    (product?.name || "").toLowerCase().includes("reforma") ||
    (product?.category || "").toLowerCase().includes("reforma") ||
    (product?.operationalCategory || "").toLowerCase().includes("reforma");

  // Dimensões físicas e precificação do modelo
  const mattressDim = detectMattressDimensions(product?.name || "", product?.category || "");
  const baseProductPrice = Number(product.price) || 0;
  const baseMinimumPrice = Number(product.minimumPrice) || 0;

  // Estados de Personalização
  // 1. Tampo de cima
  const [selectedTopFabric, setSelectedTopFabric] = useState(TOP_FABRIC_OPTIONS[0]);
  const [customTopFabricName, setCustomTopFabricName] = useState("");

  // 2. Tampo de baixo (apenas reforma)
  const [selectedBottomFabric, setSelectedBottomFabric] = useState(BOTTOM_FABRIC_OPTIONS[0]);
  const [customBottomFabricName, setCustomBottomFabricName] = useState("");

  // 3. Tecido Lateral
  const [selectedSideColor, setSelectedSideColor] = useState(SIDE_FABRIC_COLORS[0]);
  const [customSideColorName, setCustomSideColorName] = useState("");

  // 4. Fitilho (apenas reforma)
  const [selectedFitilho, setSelectedFitilho] = useState(FITILHO_OPTIONS[0]);
  const [customFitilhoName, setCustomFitilhoName] = useState("");

  // 5. Camada extra de espuma (apenas reforma, estritamente 5cm)
  const [selectedFoam, setSelectedFoam] = useState(REFORM_EXTRA_FOAM_OPTIONS[0]);
  const [customFoamNotes, setCustomFoamNotes] = useState("");

  // 6. Conversão para Vibro (apenas reforma)
  const [hasVibroConversion, setHasVibroConversion] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [technicalNotes, setTechnicalNotes] = useState("");

  // Cálculos de Preço Adicional
  const activeFoamPricing = isReforma
    ? getExtraFoamPricing(selectedFoam.id, mattressDim.sizeKey)
    : { additionalPrice: 0, minimumFloorPrice: 0, directCost: 0, volumeM3: 0, priceBadge: "Incluso" };

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
  const fitilhoPadraoSupply = supplyItems.find((s: any) => s.code === "INS-FIT-035");

  // Atualização dinâmica ao selecionar espuma de 5cm
  const handleSelectFoam = (f: typeof REFORM_EXTRA_FOAM_OPTIONS[0]) => {
    const oldPricing = getExtraFoamPricing(selectedFoam.id, mattressDim.sizeKey);
    const newPricing = getExtraFoamPricing(f.id, mattressDim.sizeKey);
    const diff = newPricing.additionalPrice - oldPricing.additionalPrice;
    setSelectedFoam(f);
    setUnitPrice((prev) => Math.max(0, prev + diff));
  };

  // Atualização dinâmica ao alterar conversão para vibro
  const handleToggleVibro = (active: boolean) => {
    if (active === hasVibroConversion) return;
    setHasVibroConversion(active);
    const diff = active ? VIBRO_CONVERSION_PRICE : -VIBRO_CONVERSION_PRICE;
    setUnitPrice((prev) => Math.max(0, prev + diff));
  };

  const handleSubmit = () => {
    const finalTopName = customTopFabricName.trim() ? customTopFabricName.trim() : selectedTopFabric.name;
    const finalBottomName = customBottomFabricName.trim()
      ? customBottomFabricName.trim()
      : selectedBottomFabric.name;
    const finalSideName = customSideColorName.trim() ? customSideColorName.trim() : selectedSideColor.name;
    const finalFitilhoName = customFitilhoName.trim()
      ? customFitilhoName.trim()
      : selectedFitilho.id === "tom_sobre_tom"
      ? `Tom sobre Tom (${finalSideName})`
      : selectedFitilho.name;
    const finalFoamName = customFoamNotes.trim()
      ? `${selectedFoam.name} (${customFoamNotes.trim()})`
      : selectedFoam.name;

    const summaryParts = [
      `Tampo de Cima: ${finalTopName}`,
      isReforma ? `Tampo de Baixo: ${finalBottomName}` : null,
      `Faixa Lateral: ${finalSideName}`,
      isReforma ? `Fitilho: ${finalFitilhoName}` : null,
      isReforma && selectedFoam.id !== "sem_extra" ? `Espuma: ${finalFoamName} (${activeFoamPricing.priceBadge})` : null,
      isReforma && hasVibroConversion ? `Conversão para Vibro (+${formatBRL(VIBRO_CONVERSION_PRICE)})` : null,
    ].filter(Boolean);

    const details = {
      isReforma,
      // 1. Tampo de cima
      topFabricColor: finalTopName,
      topColor: finalTopName,
      topFabricId: matelasseSupply?.id || null,

      // 2. Tampo de baixo (reforma)
      bottomFabricColor: isReforma ? finalBottomName : null,
      bottomFabricId: null,

      // 3. Faixa Lateral
      sideFabricColor: finalSideName,
      sideColor: finalSideName,
      sideFabricId: veludoSupply?.id || null,
      fabricColorHex: selectedSideColor.hex,

      // 4. Fitilho (reforma)
      fitilhoColor: isReforma ? finalFitilhoName : null,
      fitilhoType: isReforma ? selectedFitilho.name : null,
      fitilhoSupplyItemId: isReforma ? fitilhoPadraoSupply?.id : null,

      // 5. Camada Extra de Espuma (reforma - apenas 5cm)
      extraFoamOption: isReforma ? finalFoamName : "Padrão de Fábrica",
      hasExtraFoam: isReforma && selectedFoam.id !== "sem_extra",
      addedFoamHeight: isReforma ? selectedFoam.height : 0,
      extraFoamPrice: isReforma ? activeFoamPricing.additionalPrice : 0,
      extraFoamCost: isReforma ? activeFoamPricing.directCost : 0,
      foamVolumeM3: isReforma ? activeFoamPricing.volumeM3 : 0,

      // 6. Conversão para Vibro (reforma)
      hasVibroConversion: isReforma && hasVibroConversion,
      vibroPrice: isReforma && hasVibroConversion ? VIBRO_CONVERSION_PRICE : 0,
      vibroCost: isReforma && hasVibroConversion ? VIBRO_CONVERSION_COST : 0,

      // Dimensões
      mattressSize: mattressDim.sizeKey,
      commercialSize: mattressDim.sizeKey.toLowerCase(),

      // Observações e Resumo
      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: summaryParts.join(" • "),
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        {/* Cabeçalho do Colchão */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isReforma ? "Reforma de Colchão" : "Colchão Novo (Padrão da Linha)"}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                {mattressDim.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-200">
              <Layers className="h-3 w-3 text-blue-600" />
              <span>{isReforma ? "Especificação de Reforma" : "Padrão de Fábrica"}</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isReforma ? (
              <>Opções oficiais de reforma: Tampo de cima, tampo de baixo, faixa lateral, fitilho, camada de 5cm e vibro.</>
            ) : (
              <>O colchão novo segue rigorosamente a estrutura da linha. Personalize as opções de tecido disponíveis.</>
            )}
          </p>
        </div>

        {/* ALERTA DE LINHA NOVO */}
        {!isReforma && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-start gap-2.5 text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Padrão da Linha Homologado:</strong> A densidade, molas e camadas de conforto seguem a ficha técnica original deste modelo novo. Personalize abaixo as opções de tecido da superfície e faixa lateral.
            </p>
          </div>
        )}

        {/* 1. SELEÇÃO DO TECIDO DO TAMPO DE CIMA */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tampo de Cima (Superfície Superior)</h4>
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
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}
                  >
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
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro tampo de cima:</span>
            <input
              type="text"
              placeholder="Digite o nome do tecido sob encomenda..."
              value={customTopFabricName}
              onChange={(e) => setCustomTopFabricName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 2. TAMPO DE BAIXO (EXCLUSIVO PARA REFORMA) */}
        {isReforma && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Tampo de Baixo (Superfície Inferior)</h4>
                  <p className="text-[11px] text-slate-500">Defina se será padrão 1 face (TNT antiderrapante) ou dupla face</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                {customBottomFabricName.trim() ? customBottomFabricName : selectedBottomFabric.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 leading-tight">{bf.name}</p>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {bf.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{bf.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro tampo de baixo:</span>
              <input
                type="text"
                placeholder="Ex: TNT 150g impermeabilizado, etc..."
                value={customBottomFabricName}
                onChange={(e) => setCustomBottomFabricName(e.target.value)}
                className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* 3. SELEÇÃO DA COR DO TECIDO LATERAL (VELUDO DA FAIXA) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tecido Lateral (Faixa de Veludo / Suede)</h4>
                <p className="text-[11px] text-slate-500">Escolha a cor do revestimento lateral do colchão</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-black text-primary">
              {customSideColorName.trim() ? customSideColorName : selectedSideColor.name}
            </span>
          </div>

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
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className="h-6 w-6 rounded-lg border border-black/10 shrink-0 shadow-xs flex items-center justify-center"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`h-3.5 w-3.5 stroke-[3] ${c.isLight ? "text-slate-900" : "text-white"}`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">{c.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{c.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro tecido lateral:</span>
            <input
              type="text"
              placeholder="Digite outra cor ou tecido sob encomenda..."
              value={customSideColorName}
              onChange={(e) => setCustomSideColorName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 4. FITILHO (EXCLUSIVO PARA REFORMA) */}
        {isReforma && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Ribbon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Fitilho de Fechamento (Debrum)</h4>
                  <p className="text-[11px] text-slate-500">Acabamento das bordas superior e inferior do colchão</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
                {customFitilhoName.trim()
                  ? customFitilhoName
                  : selectedFitilho.id === "tom_sobre_tom"
                  ? `Tom sobre Tom (${selectedSideColor.name})`
                  : selectedFitilho.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
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
                        : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
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
                      <p className="text-[10px] text-slate-500 mt-0.5">{fit.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro fitilho:</span>
              <input
                type="text"
                placeholder="Ex: Fitilho dourado, marrom escuro..."
                value={customFitilhoName}
                onChange={(e) => setCustomFitilhoName(e.target.value)}
                className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* 5. CAMADA ADICIONAL DE ESPUMA - SÓ DE 5 CM (EXCLUSIVO PARA REFORMA) */}
        {isReforma && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Camada Adicional de Espuma (Apenas 5 cm)</h4>
                  <p className="text-[11px] text-slate-500">Adicione conforto ou firmeza postural com lâmina de 5cm</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[170px]">
                {selectedFoam.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {REFORM_EXTRA_FOAM_OPTIONS.map((f) => {
                const isSelected = selectedFoam.id === f.id;
                const fPricing = getExtraFoamPricing(f.id, mattressDim.sizeKey);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFoam(f)}
                    className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm"
                        : "border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                            f.id === "sem_extra"
                              ? "bg-slate-100 text-slate-600 border border-slate-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {fPricing.priceBadge}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{f.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{f.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedFoam.id !== "sem_extra" && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">Observação da espuma:</span>
                <input
                  type="text"
                  placeholder="Ex: Espuma 5cm colada na face superior..."
                  value={customFoamNotes}
                  onChange={(e) => setCustomFoamNotes(e.target.value)}
                  className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}

        {/* 6. CONVERSÃO PARA VIBRO (EXCLUSIVO PARA REFORMA) */}
        {isReforma && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Conversão para Vibroterapia (Massagem)</h4>
                  <p className="text-[11px] text-slate-500">Instalação de kit de massagem com cápsulas vibratórias e controle</p>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  hasVibroConversion
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {hasVibroConversion ? `+ ${formatBRL(VIBRO_CONVERSION_PRICE)}` : "Não Converter"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleToggleVibro(false)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  !hasVibroConversion
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-slate-200 bg-slate-50/60 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      !hasVibroConversion ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {!hasVibroConversion && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Manter Colchão Tradicional</p>
                    <p className="text-[10px] text-slate-500">Sem sistema de vibroterapia (+R$ 0,00)</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleVibro(true)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  hasVibroConversion
                    ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20 shadow-sm"
                    : "border-slate-200 bg-slate-50/60 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      hasVibroConversion ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {hasVibroConversion && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900">Conversão para Vibroterapia</p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                        + {formatBRL(VIBRO_CONVERSION_PRICE)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Cápsulas de massagem + fonte bivolt + controle remoto</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Observações Técnicas */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700">
            Observações Técnicas para Produção
          </label>
          <textarea
            rows={2}
            value={technicalNotes}
            onChange={(e) => setTechnicalNotes(e.target.value)}
            placeholder="Instruções de acabamento, detalhes da entrega, exigências do cliente..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Barra Inferior com Quantidade, Preço Unitário e Adicionar */}
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
