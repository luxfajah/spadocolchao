"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePos } from "../PosContext";

export function BoxReformForm({ product, onAdd, onCancel }: { product: any, onAdd: (details: any, price: number) => void, onCancel: () => void }) {
  const { initialData } = usePos();
  const supplyItems = initialData?.supplyItems || [];

  const fabrics = supplyItems.filter((i: any) => i.category?.name === 'Tecidos e Revestimentos');
  const topFabrics = fabrics.filter((f: any) => f.name.toLowerCase().includes('tnt'));
  const sideFabrics = fabrics.filter((f: any) => f.name.toLowerCase().includes('box'));
  
  const tapes = supplyItems.filter((i: any) => i.name.toLowerCase().includes('fita') && i.category?.name?.includes('Acessório'));
  const boxFeet = supplyItems.filter((i: any) => i.name.toLowerCase().includes('pé') || i.name.toLowerCase().includes('pezinho'));

  const [data, setData] = useState({
    serviceType: product.name.toLowerCase().includes('simples') ? 'simples' : 'profunda',
    boxType: 'comum',
    commercialSize: 'casal',
    actualWidth: '',
    actualLength: '',
    actualHeight: '',
    optTotalReplacement: false,
    optFullFabricRepl: true,
    optStructureReinforce: false,
    optHardwareReplacement: false,
    
    topFabricId: '',
    topColor: '', // Opcional
    sideFabricId: '',
    sideColor: '',
    
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tipo de Box</label>
          <select name="boxType" value={data.boxType} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            <option value="comum">Box Comum</option>
            <option value="bau">Box Baú</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-muted-foreground">Tamanho Comercial</label>
          <select name="commercialSize" value={data.commercialSize} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
            {["solteiro", "solteiro king", "casal", "queen", "king", "sob medida"].map(s => <option key={s} value={s}>{s}</option>)}
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
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optStructureReinforce" checked={data.optStructureReinforce} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Reforço da estrutura</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optHardwareReplacement" checked={data.optHardwareReplacement} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Troca de ferragens</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="optFullFabricRepl" checked={data.optFullFabricRepl} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-900"/> Troca completa de tecido</label>
        </div>
      </div>
      <div className="space-y-3 border p-3 rounded-lg bg-muted/10 mt-4">
        <span className="text-sm font-semibold border-b block pb-1">Tecidos da Reforma</span>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tecido do Tampo Superior (TNT)</label>
            <select name="topFabricId" value={data.topFabricId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
              <option value="">Nenhum / Não Trocar</option>
              {topFabrics.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tecido da Faixa Lateral</label>
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
             <label className="text-xs text-muted-foreground">Jogo de Pés (Box)</label>
             <select name="feetSupplyItemId" value={data.feetSupplyItemId} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500">
               <option value="">Nenhum / Não Trocar</option>
               {boxFeet.map((f: any) => <option key={f.id} value={f.id}>{f.name} (Estoque: {f.currentStock}{f.unit})</option>)}
             </select>
          </div>
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
