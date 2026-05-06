"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePos } from "../PosContext";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Ruler, 
  Layers, 
  Settings2, 
  ShoppingBag, 
  ShieldCheck, 
  Box as BoxIcon,
  Zap,
  Waves,
  Maximize
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NewMattressForm({ product, onAdd, onCancel }: { product: any, onAdd: (details: any, price: number) => void, onCancel: () => void }) {
  const { initialData } = usePos();
  const supplyItems = initialData?.supplyItems || [];

  const allFabrics = supplyItems.filter((i: any) => 
    i.category?.name?.includes('Tecido') || 
    i.category?.name?.includes('Revestimento')
  );
  const topFabrics = allFabrics.filter((f: any) => f.name.toLowerCase().includes('tampo') || f.name.toLowerCase().includes('jacquard') || f.name.toLowerCase().includes('malha'));
  const sideFabrics = allFabrics.filter((f: any) => f.name.toLowerCase().includes('lateral') || f.name.toLowerCase().includes('suede'));
  const bottomFabrics = allFabrics.filter((f: any) => f.name.toLowerCase().includes('tnt') || f.name.toLowerCase().includes('tampo') || f.name.toLowerCase().includes('fundo'));
  const foams = supplyItems.filter((i: any) => i.name.toLowerCase().includes('espuma') || i.category?.name?.includes('Espuma'));
  const tapes = supplyItems.filter((i: any) => 
    (i.name.toLowerCase().includes('fita') || i.name.toLowerCase().includes('fitilho') || i.name.toLowerCase().includes('viés'))
  );
  const mattressFeet = supplyItems.filter((i: any) => i.name.toLowerCase().includes('pé') || i.name.toLowerCase().includes('pezinho'));

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    commercialSize: 'casal',
    actualWidth: '',
    actualLength: '',
    actualHeight: '',
    mattressType: 'espuma',
    density: 'D33',
    productLevel: 'standard', // economica, standard, premium, luxo
    warrantyDays: 365,

    topFabricId: '',
    bottomFabricId: '',
    sideFabricId: '',
    foamSupplyItemId: '',
    tapeSupplyItemId: '',
    feetSupplyItemId: '',
    
    pillowType: 'NENHUM',
    lateralReinforce: false,
    viscoElastic: false,

    technicalNotes: '',
    finalPrice: product.price,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const setVal = (name: string, value: any) => {
    setData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(data, Number(data.finalPrice));
  };

  const sizes = [
    { id: 'solteiro', label: 'Solteiro', desc: '88 x 188' },
    { id: 'casal', label: 'Casal', desc: '138 x 188' },
    { id: 'queen', label: 'Queen', desc: '158 x 198' },
    { id: 'king', label: 'King', desc: '193 x 203' },
    { id: 'sob medida', label: 'Especial', desc: 'Personalizado' },
  ];

  const types = [
    { id: 'espuma', label: 'Espuma', icon: BoxIcon },
    { id: 'molas', label: 'Molas', icon: Waves },
    { id: 'magnético', label: 'Magnético', icon: Zap },
    { id: 'massageador', label: 'Massageador', icon: Settings2 },
  ];

  const levels = [
    { id: 'economica', label: 'Econômica', color: 'bg-slate-100 text-slate-700', price: 0 },
    { id: 'standard', label: 'Standard', color: 'bg-blue-100 text-blue-700', price: 200 },
    { id: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-700', price: 400 },
    { id: 'luxo', label: 'Luxo', color: 'bg-amber-100 text-amber-900 border-amber-200', price: 800 },
  ];

  // Cálculo de Preço Dinâmico (Mock)
  const priceBreakdown = useMemo(() => {
    let base = Number(product.price) || 850;
    let extras = 0;
    
    if (data.pillowType !== 'NENHUM') extras += 250;
    if (data.lateralReinforce) extras += 100;
    if (data.viscoElastic) extras += 150;
    
    const levelObj = levels.find((l: any) => l.id === data.productLevel);
    if (levelObj) extras += levelObj.price;

    return {
      base,
      extras,
      total: base + extras
    };
  }, [data, product.price]);

  // Atualiza o preço final quando o cálculo muda
  useMemo(() => {
    setVal('finalPrice', priceBreakdown.total);
  }, [priceBreakdown.total]);

  const steps = [
    { id: 1, title: "Identificação", icon: Ruler },
    { id: 2, title: "Tecidos", icon: Layers },
    { id: 3, title: "Engenharia", icon: Settings2 },
    { id: 4, title: "Resumo", icon: ShoppingBag },
    { id: 5, title: "Finalização", icon: ShieldCheck },
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Steps Header */}
      <div className="flex items-center justify-between mb-8 px-2 overflow-x-auto pb-2 gap-4">
        {steps.map((s) => (
          <div key={s.id} className="flex flex-col items-center min-w-[70px] relative">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
              step === s.id ? "bg-brand-900 border-brand-900 text-white scale-110 shadow-lg" : 
              step > s.id ? "bg-green-500 border-green-500 text-white" : 
              "bg-background border-muted-foreground/30 text-muted-foreground"
            )}>
              {step > s.id ? <Check size={18} /> : <s.icon size={18} />}
            </div>
            <span className={cn(
              "text-[10px] mt-2 font-bold uppercase tracking-tight text-center whitespace-nowrap",
              step === s.id ? "text-brand-900" : "text-muted-foreground"
            )}>{s.title}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1 space-y-6">
        
        {/* STEP 1: IDENTIFICAÇÃO */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Tipo de Colchão</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setVal('mattressType', t.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:border-brand-500/50",
                      data.mattressType === t.id ? "border-brand-900 bg-brand-50 dark:bg-brand-950/30 ring-1 ring-brand-900" : "border-muted bg-card"
                    )}
                  >
                    <t.icon className={cn("mb-2", data.mattressType === t.id ? "text-brand-900" : "text-muted-foreground")} size={24} />
                    <span className="text-[11px] font-bold uppercase">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Tamanho Comercial</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setVal('commercialSize', s.id)}
                    className={cn(
                      "flex flex-col p-3 rounded-xl border-2 text-left transition-all",
                      data.commercialSize === s.id ? "border-brand-900 bg-brand-50 dark:bg-brand-950/30 ring-1 ring-brand-900" : "border-muted bg-card"
                    )}
                  >
                    <span className="text-xs font-bold uppercase">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-muted/20 p-6 rounded-2xl border">
              <div className="col-span-3 pb-2"><h4 className="text-sm font-bold flex items-center gap-2"><Maximize size={16} className="text-brand-900" /> Dimensões Planejadas (cm)</h4></div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Largura</label>
                <Input type="number" name="actualWidth" value={data.actualWidth} onChange={handleChange} className="h-12 text-lg font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Comprimento</label>
                <Input type="number" name="actualLength" value={data.actualLength} onChange={handleChange} className="h-12 text-lg font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Altura</label>
                <Input type="number" name="actualHeight" value={data.actualHeight} onChange={handleChange} className="h-12 text-lg font-bold" required />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TECIDOS E ACABAMENTOS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tecido Superior (Tampo)</label>
                <select name="topFabricId" value={data.topFabricId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <option value="">Selecione o Tampo...</option>
                  {topFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tecido Lateral (Faixa)</label>
                <select name="sideFabricId" value={data.sideFabricId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <option value="">Selecione a Lateral...</option>
                  {sideFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tecido Inferior (Fundo)</label>
                <select name="bottomFabricId" value={data.bottomFabricId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <option value="">Tampo Duplo (Igual ao Superior)</option>
                  {bottomFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Acabamento (Fitilho)</label>
                <select name="tapeSupplyItemId" value={data.tapeSupplyItemId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <option value="">Selecione...</option>
                  {tapes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acessórios da Base</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Jogo de Pés (Se houver Base)</label>
                  <select name="feetSupplyItemId" value={data.feetSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-lg border bg-background px-3 text-xs">
                    <option value="">Nenhum / Não aplicável</option>
                    {mattressFeet.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ENGENHARIA DE CONFORTO */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-gradient-to-br from-brand-50 to-slate-50 dark:from-brand-950/20 dark:to-slate-950/20 p-6 rounded-2xl border border-brand-200 shadow-inner">
              <h3 className="text-lg font-black text-brand-900 dark:text-brand-400 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Settings2 size={24} /> Engenharia do Produto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-brand-800 dark:text-brand-300 block uppercase tracking-tighter">Núcleo do Colchão (Miolo)</label>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-700 uppercase">Matéria-Prima do Núcleo</label>
                      <select name="foamSupplyItemId" value={data.foamSupplyItemId} onChange={handleChange} className="flex h-12 w-full rounded-xl border-2 border-brand-200 bg-white px-4 text-sm font-bold shadow-sm focus:ring-brand-500">
                        <option value="">Selecione a Espuma/Mola...</option>
                        {foams.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>

                    {(data.mattressType === 'espuma' || data.mattressType === 'magnético') && (
                      <div className="space-y-1 animate-in zoom-in-95 duration-200">
                        <label className="text-[10px] font-bold text-brand-700 uppercase">Densidade Nominal</label>
                        <select name="density" value={data.density} onChange={handleChange} className="flex h-10 w-full rounded-lg border bg-white px-3 text-xs font-bold">
                          {['D20', 'D23', 'D28', 'D33', 'D40', 'D45'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-brand-800 dark:text-brand-300 block uppercase tracking-tighter">Opcionais de Conforto</label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-brand-700 uppercase">Acabamento Pillow Top</label>
                      <select name="pillowType" value={data.pillowType} onChange={handleChange} className="flex h-10 w-full rounded-lg border bg-white px-3 text-xs">
                        <option value="NENHUM">Sem Pillow Top</option>
                        <option value="EURO">Euro Pillow (Interno)</option>
                        <option value="ORTO">Pillow Ortopédico</option>
                        <option value="PREMIUM">Pillow Top 5cm (Acoplado)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-brand-100 cursor-pointer hover:bg-white transition-all shadow-sm">
                        <input type="checkbox" name="lateralReinforce" checked={data.lateralReinforce} onChange={handleChange} className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-600"/>
                        <div>
                          <span className="text-sm font-bold text-brand-900 block">Borda Perimetral</span>
                          <span className="text-[10px] text-brand-700 font-medium leading-none uppercase tracking-tighter">Reforço lateral de sustentação</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-brand-100 cursor-pointer hover:bg-white transition-all shadow-sm">
                        <input type="checkbox" name="viscoElastic" checked={data.viscoElastic} onChange={handleChange} className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-600"/>
                        <div>
                          <span className="text-sm font-bold text-brand-900 block">Camada Visco (Nasa)</span>
                          <span className="text-[10px] text-brand-700 font-medium leading-none uppercase tracking-tighter">Alívio de pressão premium</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RESUMO TÉCNICO */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border shadow-sm">
              <h3 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                <Check className="text-green-500" /> Especificação Técnica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border space-y-2">
                    <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Produto Final</span>
                    <p className="text-lg font-bold leading-tight">{data.mattressType.toUpperCase()} {data.commercialSize.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{data.actualWidth}x{data.actualLength}x{data.actualHeight} cm (Planejado)</p>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border space-y-2">
                    <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Destaques da Engenharia</span>
                    <ul className="text-sm space-y-1 font-medium">
                      <li>• Núcleo: {foams.find((f: any) => f.id === data.foamSupplyItemId)?.name || 'Não selecionado'}</li>
                      {data.density && <li>• Densidade: {data.density}</li>}
                      {data.pillowType !== 'NENHUM' && <li>• Acabamento: {data.pillowType}</li>}
                      {data.lateralReinforce && <li>• Borda Perimetral Inclusa</li>}
                      {data.viscoElastic && <li>• Tecnologia Viscoelástica</li>}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border space-y-2">
                    <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Revestimento Escolhido</span>
                    <div className="text-xs space-y-2">
                      <p><strong>Tampo:</strong> {topFabrics.find((f: any) => f.id === data.topFabricId)?.name || 'Padrão'}</p>
                      <p><strong>Lateral:</strong> {sideFabrics.find((f: any) => f.id === data.sideFabricId)?.name || 'Padrão'}</p>
                      <p><strong>Fitilho:</strong> {tapes.find((t: any) => t.id === data.tapeSupplyItemId)?.name || 'Padrão'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Observações de Produção</label>
                    <textarea 
                      name="technicalNotes" 
                      value={data.technicalNotes} 
                      onChange={handleChange} 
                      className="flex min-h-[100px] w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:ring-brand-900 shadow-sm" 
                      placeholder="Alguma instrução especial para a montagem?"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: VALOR E GARANTIA */}
        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Zap size={16} /> Nível de Qualidade
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {levels.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setVal('productLevel', l.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all shadow-sm",
                          data.productLevel === l.id ? "ring-4 ring-brand-900/10 border-brand-900" : "border-slate-100 bg-slate-50"
                        )}
                      >
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase mb-3", l.color)}>
                          {l.label}
                        </span>
                        <span className="text-xs font-bold text-slate-600">Investimento</span>
                        <span className="text-sm font-black text-slate-900">+{l.price > 0 ? `R$ ${l.price}` : 'Base'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-3xl space-y-4">
                  <h4 className="text-sm font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={20} /> Garantia de Fábrica
                  </h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-700 uppercase">Período Total (Dias)</label>
                    <div className="flex gap-2">
                      {[365, 730, 1095].map(days => (
                        <Button 
                          key={days} 
                          type="button" 
                          variant={data.warrantyDays === days ? "default" : "outline"}
                          className={cn("flex-1 h-12 rounded-xl text-lg font-black", data.warrantyDays === days ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700")}
                          onClick={() => setVal('warrantyDays', days)}
                        >
                          {days / 365} Ano{days > 365 ? 's' : ''}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-700 font-medium leading-tight italic">A garantia Spa do Colchão é integral e cobre qualquer defeito de fabricação ou fadiga excessiva de materiais.</p>
                </div>
              </div>

              <div className="bg-brand-950 text-white p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-400">Composição de Preço</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Produto Base</span>
                      <span className="font-bold">R$ {priceBreakdown.base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Engenharia e Opcionais</span>
                      <span className="font-bold">+ R$ {priceBreakdown.extras.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-800 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-brand-400 font-black text-3xl italic uppercase tracking-tighter">Total</span>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Preço de Venda</span>
                        <span className="text-5xl font-black tracking-tighter text-brand-50">R$ {priceBreakdown.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <Input 
                    type="number" 
                    step="0.01" 
                    name="finalPrice" 
                    value={data.finalPrice} 
                    onChange={handleChange} 
                    className="h-16 bg-white/10 border-white/20 text-white text-2xl font-black text-center rounded-2xl mb-4" 
                    required 
                  />
                  <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">Ajuste manual permitido</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </form>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-6 border-t mt-4 px-2">
        <Button 
          variant="ghost" 
          type="button" 
          onClick={step === 1 ? onCancel : prevStep}
          className="h-12 px-6 font-bold uppercase text-xs"
        >
          {step === 1 ? "Cancelar" : <span className="flex items-center gap-2"><ChevronLeft size={16}/> Voltar</span>}
        </Button>

        <div className="flex gap-3">
          {step < 5 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="h-12 px-8 bg-brand-900 hover:bg-brand-800 text-white font-black uppercase text-xs flex items-center gap-2 rounded-xl shadow-lg"
            >
              Próximo <ChevronRight size={18} />
            </Button>
          ) : (
            <Button 
              type="submit" 
              onClick={handleSubmit}
              className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs flex items-center gap-2 rounded-xl shadow-lg shadow-green-900/20"
            >
              Adicionar ao Carrinho <Check size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
