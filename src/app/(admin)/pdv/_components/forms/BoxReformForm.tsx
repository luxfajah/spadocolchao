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
  Maximize,
  Hammer,
  Truck
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BoxReformForm({ product, onAdd, onCancel }: { product: any, onAdd: (details: any, price: number) => void, onCancel: () => void }) {
  const { initialData } = usePos();
  const supplyItems = initialData?.supplyItems || [];

  const fabrics = supplyItems.filter((i: any) => 
    i.category?.name?.includes('Tecido') || 
    i.category?.name?.includes('Revestimento')
  );
  const topFabrics = fabrics.filter((f: any) => f.name.toLowerCase().includes('tnt') || f.name.toLowerCase().includes('tampo'));
  const sideFabrics = fabrics.filter((f: any) => f.name.toLowerCase().includes('box') || f.name.toLowerCase().includes('lateral') || f.name.toLowerCase().includes('suede'));
  
  const tapes = supplyItems.filter((i: any) => 
    (i.name.toLowerCase().includes('fita') || i.name.toLowerCase().includes('fitilho') || i.name.toLowerCase().includes('viés'))
  );
  const boxFeet = supplyItems.filter((i: any) => i.name.toLowerCase().includes('pé') || i.name.toLowerCase().includes('pezinho'));

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    boxType: 'comum',
    commercialSize: 'casal',
    actualWidth: '',
    actualLength: '',
    actualHeight: '',
    
    optStructureReinforce: false,
    optHardwareReplacement: false,
    optFullFabricRepl: true,
    
    topFabricId: '',
    sideFabricId: '',
    tapeSupplyItemId: '',
    feetSupplyItemId: '',

    reformLevel: 'standard', // economica, standard, premium, luxo
    warrantyDays: 90,

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
    { id: 'comum', label: 'Box Comum', icon: BoxIcon },
    { id: 'bau', label: 'Box Baú', icon: ShoppingBag },
  ];

  const levels = [
    { id: 'economica', label: 'Econômica', color: 'bg-slate-100 text-slate-700', price: 0 },
    { id: 'standard', label: 'Standard', color: 'bg-blue-100 text-blue-700', price: 100 },
    { id: 'premium', label: 'Premium', color: 'bg-purple-100 text-purple-700', price: 250 },
    { id: 'luxo', label: 'Luxo', color: 'bg-amber-100 text-amber-900 border-amber-200', price: 450 },
  ];

  const priceBreakdown = useMemo(() => {
    let base = Number(product.price) || 350;
    let extras = 0;
    
    if (data.optStructureReinforce) extras += 80;
    if (data.optHardwareReplacement) extras += 120;
    if (data.optFullFabricRepl) extras += 50;
    
    const levelObj = levels.find((l: any) => l.id === data.reformLevel);
    if (levelObj) extras += levelObj.price;

    return { base, extras, total: base + extras };
  }, [data, product.price]);

  useMemo(() => {
    setVal('finalPrice', priceBreakdown.total);
  }, [priceBreakdown.total]);

  const steps = [
    { id: 1, title: "Identificação", icon: Ruler },
    { id: 2, title: "Serviços", icon: Hammer },
    { id: 3, title: "Materiais", icon: Layers },
    { id: 4, title: "Resumo", icon: Check },
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
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Tipo de Box</label>
              <div className="grid grid-cols-2 gap-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setVal('boxType', t.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
                      data.boxType === t.id ? "border-brand-900 bg-brand-50 ring-1 ring-brand-900" : "border-muted bg-card"
                    )}
                  >
                    <t.icon className={cn("mb-2", data.boxType === t.id ? "text-brand-900" : "text-muted-foreground")} size={32} />
                    <span className="text-xs font-bold uppercase">{t.label}</span>
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
                      data.commercialSize === s.id ? "border-brand-900 bg-brand-50 ring-1 ring-brand-900" : "border-muted bg-card"
                    )}
                  >
                    <span className="text-xs font-bold uppercase">{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-muted/20 p-6 rounded-2xl border">
              <div className="col-span-3 pb-2"><h4 className="text-sm font-bold flex items-center gap-2"><Maximize size={16} className="text-brand-900" /> Dimensões Reais (cm)</h4></div>
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

        {/* STEP 2: SERVIÇOS E ESTRUTURA */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Hammer size={24} className="text-brand-900" /> Itens de Reforma
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <label className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm",
                data.optStructureReinforce ? "border-brand-900 bg-brand-50" : "border-slate-100 bg-white"
              )}>
                <input type="checkbox" name="optStructureReinforce" checked={data.optStructureReinforce} onChange={handleChange} className="h-6 w-6 rounded border-brand-300 text-brand-900 focus:ring-brand-900"/>
                <div>
                  <span className="text-sm font-black text-slate-900 block uppercase tracking-tight">Reforço da Estrutura</span>
                  <span className="text-xs text-slate-600">Correção de rangidos e fortalecimento da madeira interna.</span>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm",
                data.optHardwareReplacement ? "border-brand-900 bg-brand-50" : "border-slate-100 bg-white"
              )}>
                <input type="checkbox" name="optHardwareReplacement" checked={data.optHardwareReplacement} onChange={handleChange} className="h-6 w-6 rounded border-brand-300 text-brand-900 focus:ring-brand-900"/>
                <div>
                  <span className="text-sm font-black text-slate-900 block uppercase tracking-tight">Troca de Ferragens / Amortecedores</span>
                  <span className="text-xs text-slate-600">Substituição de pistões e dobradiças (para Baú).</span>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-sm",
                data.optFullFabricRepl ? "border-brand-900 bg-brand-50" : "border-slate-100 bg-white"
              )}>
                <input type="checkbox" name="optFullFabricRepl" checked={data.optFullFabricRepl} onChange={handleChange} className="h-6 w-6 rounded border-brand-300 text-brand-900 focus:ring-brand-900"/>
                <div>
                  <span className="text-sm font-black text-slate-900 block uppercase tracking-tight">Troca Completa de Revestimento</span>
                  <span className="text-xs text-slate-600">Remoção total do tecido antigo e aplicação de novo material.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: MATERIAIS E ACABAMENTOS */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tecido do Tampo (TNT/Superior)</label>
                <select name="topFabricId" value={data.topFabricId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-brand-500">
                  <option value="">Manter Original / Padrão</option>
                  {topFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Tecido da Faixa Lateral</label>
                <select name="sideFabricId" value={data.sideFabricId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-brand-500">
                  <option value="">Manter Original / Padrão</option>
                  {sideFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Fita de Borda</label>
                <select name="tapeSupplyItemId" value={data.tapeSupplyItemId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-brand-500">
                  <option value="">Padrão / Não Especificado</option>
                  {tapes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Jogo de Pés (Box)</label>
                <select name="feetSupplyItemId" value={data.feetSupplyItemId} onChange={handleChange} className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-brand-500">
                  <option value="">Nenhum / Não Trocar</option>
                  {boxFeet.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: RESUMO */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-6 bg-slate-50 rounded-3xl border shadow-sm">
              <h3 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                <Check className="text-green-500" /> Resumo da Reforma de Box
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border space-y-2">
                    <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Produto</span>
                    <p className="text-lg font-bold leading-tight">{data.boxType.toUpperCase()} {data.commercialSize.toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground">{data.actualWidth}x{data.actualLength}x{data.actualHeight} cm</p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border space-y-2">
                    <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Serviços Contratados</span>
                    <ul className="text-sm space-y-1 font-medium">
                      {data.optStructureReinforce && <li>• Reforço de Estrutura</li>}
                      {data.optHardwareReplacement && <li>• Troca de Ferragens</li>}
                      {data.optFullFabricRepl && <li>• Troca de Revestimento</li>}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl border space-y-2">
                    <span className="text-[10px] font-black text-brand-900 uppercase tracking-widest">Materiais</span>
                    <div className="text-xs space-y-2">
                      <p><strong>Tampo:</strong> {topFabrics.find((f: any) => f.id === data.topFabricId)?.name || 'Nenhum'}</p>
                      <p><strong>Lateral:</strong> {sideFabrics.find((f: any) => f.id === data.sideFabricId)?.name || 'Nenhum'}</p>
                      <p><strong>Pés:</strong> {boxFeet.find((f: any) => f.id === data.feetSupplyItemId)?.name || 'Nenhum'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Notas Adicionais</label>
                    <textarea 
                      name="technicalNotes" 
                      value={data.technicalNotes} 
                      onChange={handleChange} 
                      className="flex min-h-[100px] w-full rounded-xl border bg-white px-3 py-2 text-sm" 
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: FINALIZAÇÃO */}
        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-slate-500">Nível da Reforma</label>
                  <div className="grid grid-cols-2 gap-4">
                    {levels.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setVal('reformLevel', l.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all shadow-sm",
                          data.reformLevel === l.id ? "ring-4 ring-brand-900/10 border-brand-900" : "border-slate-100 bg-slate-50"
                        )}
                      >
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase mb-3", l.color)}>
                          {l.label}
                        </span>
                        <span className="text-sm font-black text-slate-900">+{l.price > 0 ? `R$ ${l.price}` : 'Base'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-3xl space-y-4">
                  <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={20} /> Garantia
                  </h4>
                  <div className="flex gap-2">
                    {[90, 180, 365].map(days => (
                      <Button 
                        key={days} 
                        type="button" 
                        variant={data.warrantyDays === days ? "default" : "outline"}
                        className="flex-1 h-12 rounded-xl text-lg font-black"
                        onClick={() => setVal('warrantyDays', days)}
                      >
                        {days}d
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-brand-950 text-white p-8 rounded-[40px] shadow-2xl flex flex-col justify-between">
                <div className="space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-slate-400">Total da Reforma</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Base</span>
                      <span className="font-bold">R$ {priceBreakdown.base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-widest">Opcionais</span>
                      <span className="font-bold">+ R$ {priceBreakdown.extras.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-800 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="text-brand-400 font-black text-3xl italic tracking-tighter">Total</span>
                      <span className="text-5xl font-black tracking-tighter text-brand-50">R$ {priceBreakdown.total.toFixed(2)}</span>
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
                </div>
              </div>

            </div>
          </div>
        )}

      </form>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center pt-6 border-t mt-4 px-2">
        <Button variant="ghost" type="button" onClick={step === 1 ? onCancel : prevStep} className="h-12 px-6 font-bold uppercase text-xs">
          {step === 1 ? "Cancelar" : <span className="flex items-center gap-2"><ChevronLeft size={16}/> Voltar</span>}
        </Button>
        <div className="flex gap-3">
          {step < 5 ? (
            <Button type="button" onClick={nextStep} className="h-12 px-8 bg-brand-900 hover:bg-brand-800 text-white font-black uppercase text-xs flex items-center gap-2 rounded-xl">
              Próximo <ChevronRight size={18} />
            </Button>
          ) : (
            <Button type="submit" onClick={handleSubmit} className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs flex items-center gap-2 rounded-xl">
              Finalizar <Check size={18} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
