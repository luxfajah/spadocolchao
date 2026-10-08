"use client";

import { useState } from "react";
import { Check, Footprints, Palette, Layers, Info } from "lucide-react";
import { usePos } from "../PosContext";

interface BoxCustomizationFormProps {
  product: any;
  onAdd: (details: any, finalPrice: number, quantity: number) => void;
  onCancel: () => void;
}

// 1. Opções de TNT de Cima (Superfície Superior do Box)
const BOX_TOP_TNT_OPTIONS = [
  {
    id: "tnt_antiderrapante_preto",
    code: "INS-TEC-TNT",
    name: "TNT Antiderrapante Preto 100g/150g",
    desc: "Padrão de Fábrica • Máxima aderência para evitar deslizamento do colchão",
    badge: "Padrão",
  },
  {
    id: "tnt_branco",
    code: "INS-TEC-TNT",
    name: "TNT Branco Reforçado",
    desc: "Superfície clara ideal para colchões brancos",
    badge: "Claro",
  },
  {
    id: "tnt_bege",
    code: "INS-TEC-TNT",
    name: "TNT Bege Linho Reforçado",
    desc: "Harmonia suave com decorações neutras e quentes",
    badge: "Neutro",
  },
];

// 2. Cartela de Cores de Tecido para Forragem (Revestimento Lateral do Box - Veludo / Suede)
const BOX_FORRAGEM_COLORS = [
  { id: "bege", name: "Bege Areia", hex: "#D4C4B5", desc: "Clássico, neutro e suave", isLight: true },
  { id: "grafite", name: "Cinza Grafite", hex: "#4A4E51", desc: "Moderno e sofisticado", isLight: false },
  { id: "preto", name: "Preto Ônix", hex: "#1A1A1A", desc: "Elegante e resistente a marcas", isLight: false },
  { id: "marrom", name: "Marrom Café", hex: "#5A3825", desc: "Rústico e acolhedor", isLight: false },
  { id: "marinho", name: "Azul Marinho", hex: "#1B2A4A", desc: "Tom nobre e contemporâneo", isLight: false },
  { id: "cinza", name: "Cinza Prata", hex: "#A9ACB0", desc: "Iluminado e acetinado", isLight: true },
  { id: "offwhite", name: "Off-White Pérola", hex: "#EDEBE6", desc: "Requinte e sofisticação", isLight: true },
  { id: "bordo", name: "Bordô Vinho", hex: "#5E1926", desc: "Personalidade marcante", isLight: false },
];

// 3. Opções de Pezinhos do Box
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
    desc: "Tom natural amadeirado suave",
  },
  {
    id: "pe_12_preto",
    code: "INS-PE-PLA-12",
    name: "Pé Plástico Reforçado 12cm Preto",
    badge: "Resistente",
    desc: "Injetado de alta densidade com rosca padrão 5/16",
  },
  {
    id: "pe_06_preto",
    code: "INS-PE-PLA-06",
    name: "Pé 6cm Rebaixado (Ideal p/ Baú)",
    badge: "Baú Rebaixado",
    desc: "Pé rebaixado de 6cm para ergonomia de altura",
  },
  {
    id: "pe_aluminio",
    code: "INS-PE-ALU-12",
    name: "Pé Alumínio Cromado 12cm",
    badge: "Cromado",
    desc: "Visual moderno espelhado",
  },
  {
    id: "pe_rodizio",
    code: "INS-PE-ROD-12",
    name: "Pés c/ Rodízio Móvel",
    badge: "Com Rodízio",
    desc: "2 pés com rodízios de giro livre e trava para limpeza",
  },
  {
    id: "sem_pes",
    code: null,
    name: "Sem Pés / Reutilizar do Cliente",
    badge: "Sem Custo",
    desc: "Para cama alvenaria, embutida ou pés já existentes",
  },
];

export function BoxCustomizationForm({
  product,
  onAdd,
  onCancel,
}: BoxCustomizationFormProps) {
  const { initialData } = usePos();

  const isReforma =
    (product?.name || "").toLowerCase().includes("reforma") ||
    (product?.category || "").toLowerCase().includes("reforma") ||
    (product?.operationalCategory || "").toLowerCase().includes("reforma");

  const isBau =
    (product?.name || "").toLowerCase().includes("baú") ||
    (product?.category || "").toLowerCase().includes("baú");

  // 1. TNT de Cima
  const [selectedTopTNT, setSelectedTopTNT] = useState(BOX_TOP_TNT_OPTIONS[0]);
  const [customTopTNTName, setCustomTopTNTName] = useState("");

  // 2. Tecido de Forragem (Veludo / Suede)
  const [selectedFabric, setSelectedFabric] = useState(BOX_FORRAGEM_COLORS[0]);
  const [customFabricName, setCustomFabricName] = useState("");

  // 3. Pezinhos
  const [selectedFeet, setSelectedFeet] = useState(
    isBau ? BOX_FEET_OPTIONS[3] : BOX_FEET_OPTIONS[0]
  );
  const [customFeetName, setCustomFeetName] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number>(Number(product.price) || 0);
  const [technicalNotes, setTechnicalNotes] = useState("");

  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Mapear insumos do estoque
  const supplyItems = initialData?.supplyItems || [];
  const veludoSupply = supplyItems.find(
    (s: any) => s.code === "INS-TEC-VEL" || s.name?.toLowerCase().includes("veludo")
  );
  const feetSupply = selectedFeet.code
    ? supplyItems.find((s: any) => s.code === selectedFeet.code)
    : null;

  const handleSubmit = () => {
    const finalTopTNTName = customTopTNTName.trim()
      ? customTopTNTName.trim()
      : selectedTopTNT.name;
    const finalForragemName = customFabricName.trim()
      ? customFabricName.trim()
      : selectedFabric.name;
    const finalFeetName = customFeetName.trim()
      ? customFeetName.trim()
      : selectedFeet.name;

    const summaryParts = [
      `TNT de Cima: ${finalTopTNTName}`,
      `Tecido de Forragem: ${finalForragemName}`,
      `Pezinhos: ${finalFeetName}`,
    ];

    const details = {
      isReforma,
      isOnlyBox: true,

      // 1. TNT de Cima
      topFabricColor: finalTopTNTName,
      topTNTColor: finalTopTNTName,
      topFabricId: null,

      // 2. Tecido de Forragem
      sideFabricColor: finalForragemName,
      sideColor: finalForragemName,
      fabricColorHex: selectedFabric.hex,
      fabricType: "Veludo / Forragem",
      sideFabricId: veludoSupply?.id || null,

      // 3. Pezinhos
      hasFeet: selectedFeet.id !== "sem_pes",
      feetType: finalFeetName,
      feetSupplyItemId: feetSupply?.id || null,

      // Regra de Ouro: Box nunca possui camada de espuma
      hasExtraFoam: false,
      extraFoamOption: "Sem Espuma",
      addedFoamHeight: 0,
      extraFoamPrice: 0,
      extraFoamCost: 0,
      foamVolumeM3: 0,

      // Observações e Resumo de Engenharia
      technicalNotes: technicalNotes.trim() || null,
      customizationSummary: summaryParts.join(" • "),
    };

    onAdd(details, unitPrice, quantity);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 sm:p-6 space-y-6">
      <div className="space-y-6">
        {/* Cabeçalho do Box */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {isReforma ? "Reforma de Box" : "Box / Baú Novo"}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                {isBau ? "Baú com Pistões" : "Box Fixo"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 border border-slate-200">
              <Layers className="h-3 w-3 text-slate-600" />
              <span>Sem Espuma • Zero Camadas</span>
            </div>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{product.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Personalização do Box: <strong>TNT de Cima</strong>, <strong>Tecido de Forragem</strong> e{" "}
            <strong>Pezinhos</strong>.
          </p>
        </div>

        {/* ALERTA DE LINHA NOVO */}
        {!isReforma && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 flex items-start gap-2.5 text-blue-900">
            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <strong>Padrão da Linha Homologado:</strong> A estrutura em madeira/MDF segue o padrão oficial deste modelo. Selecione abaixo o TNT de apoio, tecido de forragem lateral e pezinhos.
            </p>
          </div>
        )}

        {/* 1. SELEÇÃO DO TNT DE CIMA */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">TNT de Cima (Superfície Superior)</h4>
                <p className="text-[11px] text-slate-500">Superfície antiderrapante de apoio para o colchão</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
              {customTopTNTName.trim() ? customTopTNTName : selectedTopTNT.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
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
                    <p className="text-xs font-bold text-slate-900 leading-tight">{tnt.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{tnt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro TNT de cima:</span>
            <input
              type="text"
              placeholder="Digite outra gramatura ou acabamento sob medida..."
              value={customTopTNTName}
              onChange={(e) => setCustomTopTNTName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 2. SELEÇÃO DO TECIDO DE FORRAGEM (LATERAL DO BOX) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Tecido de Forragem (Revestimento Lateral)</h4>
                <p className="text-[11px] text-slate-500">Escolha a cor do revestimento de veludo/suede do box</p>
              </div>
            </div>
            <span className="rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-black text-primary">
              {customFabricName.trim() ? customFabricName : selectedFabric.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {BOX_FORRAGEM_COLORS.map((c) => {
              const isSelected = selectedFabric.id === c.id && !customFabricName.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedFabric(c);
                    setCustomFabricName("");
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
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro tecido de forragem:</span>
            <input
              type="text"
              placeholder="Digite o nome de outro tecido ou cor sob medida..."
              value={customFabricName}
              onChange={(e) => setCustomFabricName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* 3. SELEÇÃO DO PEZINHO */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Footprints className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Pezinho do Box</h4>
                <p className="text-[11px] text-slate-500">Escolha o modelo de pés para elevação e nivelamento</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[170px]">
              {customFeetName.trim() ? customFeetName : selectedFeet.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                      <p className="text-xs font-bold text-slate-900 leading-tight">{foot.name}</p>
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {foot.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">{foot.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Outro pezinho:</span>
            <input
              type="text"
              placeholder="Ex: Pés cromados 15cm, pé rodízio com trava..."
              value={customFeetName}
              onChange={(e) => setCustomFeetName(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
            placeholder="Instruções adicionais de montagem, reforço estrutural ou entrega..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Barra Inferior */}
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
              <span className="text-[10px] font-black uppercase text-slate-400">Preço Unitário (R$)</span>
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
              {unitPrice < (Number(product.price) || 0) && (
                <p className="text-[10px] font-bold text-amber-600">
                  Desconto: -{formatBRL((Number(product.price) || 0) - unitPrice)}
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
