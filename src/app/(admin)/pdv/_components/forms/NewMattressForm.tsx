"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePos } from "../PosContext";

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

  const [data, setData] = useState({
    commercialSize: 'casal',
    actualWidth: '',
    actualLength: '',
    actualHeight: '',
    mattressType: 'espuma',
    density: 'D33',

    topFabricId: '',
    bottomFabricId: '',
    sideFabricId: '',
    foamSupplyItemId: '',
    tapeSupplyItemId: '',
    feetSupplyItemId: '',

    technicalNotes: '',
    finalPrice: product.price,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(data, Number(data.finalPrice));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tamanho Comercial</label>
          <select name="commercialSize" value={data.commercialSize} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            {["solteiro", "solteiro king", "casal", "queen", "king", "sob medida"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de Colchão</label>
          <select name="mattressType" value={data.mattressType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            {["espuma", "molas", "magnético", "massageador"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {(data.mattressType === 'espuma' || data.mattressType === 'magnético') && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Densidade da Espuma</label>
          <select name="density" value={data.density} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            {['D20', 'D23', 'D28', 'D33', 'D40', 'D45'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-muted/10">
        <div className="col-span-3 pb-1 border-b mb-1"><span className="text-sm font-semibold">Dimensões Reais (cm)</span></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Largura</label><Input type="number" name="actualWidth" value={data.actualWidth} onChange={handleChange} required /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Comprimento</label><Input type="number" name="actualLength" value={data.actualLength} onChange={handleChange} required /></div>
        <div className="space-y-1"><label className="text-xs text-muted-foreground">Altura</label><Input type="number" name="actualHeight" value={data.actualHeight} onChange={handleChange} required /></div>
      </div>

      <div className="space-y-3 border p-3 rounded-lg bg-muted/10 mt-4">
        <span className="text-sm font-semibold border-b block pb-1">Composição do Colchão</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tecido Superior (Tampo)</label>
            <select name="topFabricId" value={data.topFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Selecione...</option>
              {topFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
             <label className="text-xs text-muted-foreground">Tecido Inferior (Fundo / TNT)</label>
             <select name="bottomFabricId" value={data.bottomFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Selecione...</option>
              {bottomFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tecido Lateral</label>
            <select name="sideFabricId" value={data.sideFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Selecione...</option>
              {sideFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Espuma (Miolo / Matéria-prima)</label>
            <select name="foamSupplyItemId" value={data.foamSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-slate-900 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500">
              <option value="">Selecione...</option>
              {foams.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fita de Borda</label>
            <select name="tapeSupplyItemId" value={data.tapeSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
               <option value="">Selecione...</option>
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
