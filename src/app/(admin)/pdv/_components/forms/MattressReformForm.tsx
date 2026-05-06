"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePos } from "../PosContext";

export function MattressReformForm({ product, onAdd, onCancel }: { product: any, onAdd: (details: any, price: number) => void, onCancel: () => void }) {
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

  const [data, setData] = useState({
    serviceType: product.name.toLowerCase().includes('simples') ? 'simples' : 'profunda',
    commercialSize: 'casal',
    actualWidth: '',
    actualLength: '',
    actualHeight: '',
    mattressType: 'espuma',
    density: 'D33',
    optTotalReplacement: false,
    optFoamStructReinforce: false,
    optRegluing: false,
    optSpringSystemRepl: false,
    optFullFabricRepl: false,
    optPartialFabricRepl: false,
    optLeveling: false,
    
    topFabricId: '',
    topColor: '', // Opcional se já estiver no nome do tecido, mas mantive
    bottomFabricId: '',
    sideFabricId: '',
    sideColor: '',

    foamServiceType: 'NENHUM',
    foamSupplyItemId: '',
    addedFoamHeight: '',
    
    tapeSupplyItemId: '',
    feetSupplyItemId: '',

    technicalNotes: '',
    finalPrice: product.price,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(data, Number(data.finalPrice));
  };

  const sizes = ["solteiro", "solteiro king", "casal", "queen", "king", "sob medida"];
  const types = ["espuma", "molas", "magnético", "massageador"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tamanho Comercial</label>
          <select name="commercialSize" value={data.commercialSize} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            {sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de Colchão</label>
          <select name="mattressType" value={data.mattressType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-muted/10">
        <div className="col-span-3 pb-1 border-b mb-1"><span className="text-sm font-semibold">Dimensões Reais (cm)</span></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Largura</label><Input type="number" name="actualWidth" value={data.actualWidth} onChange={handleChange} required /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Comprimento</label><Input type="number" name="actualLength" value={data.actualLength} onChange={handleChange} required /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Altura</label><Input type="number" name="actualHeight" value={data.actualHeight} onChange={handleChange} required /></div>
      </div>

      <div className="space-y-3 border p-3 rounded-lg bg-muted/10">
        <span className="text-sm font-semibold border-b block pb-1">Opções de Serviço</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optTotalReplacement" checked={data.optTotalReplacement} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Troca total e reforço de espuma</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optFoamStructReinforce" checked={data.optFoamStructReinforce} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Reforço estrutural da espuma</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optRegluing" checked={data.optRegluing} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Recolagem</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optSpringSystemRepl" checked={data.optSpringSystemRepl} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Subst. sistema de molas</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optFullFabricRepl" checked={data.optFullFabricRepl} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Troca completa de tecido</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optPartialFabricRepl" checked={data.optPartialFabricRepl} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Troca parcial de tecido</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optLeveling" checked={data.optLeveling} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Nivelamento</label>
        </div>
      </div>

      <div className="space-y-3 border p-3 rounded-lg bg-muted/10 mt-4">
        <span className="text-sm font-semibold border-b block pb-1">Tecidos da Reforma</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tecido Superior (Tampo)</label>
            <select name="topFabricId" value={data.topFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Nenhum / Não Trocar</option>
              {topFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
             <label className="text-xs text-muted-foreground">Tecido Inferior (Fundo / TNT)</label>
             <select name="bottomFabricId" value={data.bottomFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Tampo Duplo (Mesmo do Superior)</option>
              {bottomFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tecido Lateral</label>
            <select name="sideFabricId" value={data.sideFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Nenhum / Não Trocar</option>
              {sideFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 border p-3 rounded-lg bg-muted/10 mt-4">
        <span className="text-sm font-semibold border-b block pb-1">Acabamentos Especiais</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fita de Borda (Acabamento)</label>
            <select name="tapeSupplyItemId" value={data.tapeSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
               <option value="">Padrão / Não Especificada</option>
               {tapes.map((t: any) => <option key={t.id} value={t.id}>{t.name} (Estoque: {t.currentStock}{t.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Jogo de Pés (Se houver Base/Box Conjugado)</label>
            <select name="feetSupplyItemId" value={data.feetSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
               <option value="">Nenhum / Não aplicável</option>
               {mattressFeet.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3 border p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 mt-4">
        <span className="text-sm font-semibold border-b border-orange-200 block pb-1 text-orange-800 dark:text-orange-400">Aplicação de Espumas</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tipo de Serviço na Espuma</label>
            <select name="foamServiceType" value={data.foamServiceType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500">
              <option value="NENHUM">Nenhum reparo / Original</option>
              <option value="CALCO">Adicionar Calço Superior/Inferior</option>
              <option value="TROCA_PARCIAL">Troca Parcial de Espuma (Camada)</option>
              <option value="TROCA_TOTAL">Troca Total de Espumas (Miolo completo)</option>
            </select>
          </div>
          
          {data.foamServiceType !== 'NENHUM' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Selecione a Espuma (Matéria-prima)</label>
              <select name="foamSupplyItemId" value={data.foamSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500">
                <option value="">Selecione...</option>
                {foams.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
              </select>
            </div>
          )}
          
          {(data.foamServiceType === 'CALCO' || data.foamServiceType === 'TROCA_PARCIAL') && (
            <div className="space-y-1 col-span-2">
               <label className="text-xs text-muted-foreground">Altura da Espuma Trocada/Adicionada (cm)</label>
               <Input type="number" step="0.5" placeholder="Ex: 3 ou 5" name="addedFoamHeight" value={data.addedFoamHeight} onChange={handleChange} />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground">Observações Técnicas</label>
        <textarea name="technicalNotes" value={data.technicalNotes} onChange={handleChange} className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500" placeholder="Detalhes do reparo..."></textarea>
      </div>

      <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between">
        <div className="text-brand-900 font-semibold uppercase text-sm">Valor Final do Serviço (R$)</div>
        <div className="w-1/3">
          <Input type="number" step="0.01" name="finalPrice" value={data.finalPrice} onChange={handleChange} className="text-right font-bold text-lg h-12 bg-white" required />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-brand-900 hover:bg-brand-800 text-white font-semibold">Salvar Item no Carrinho</Button>
      </div>
    </form>
  );
}
