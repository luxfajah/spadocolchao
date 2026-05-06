"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Sparkles, Check, Info, ArrowRight, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpholsteryCleaningForm({ product, onAdd, onCancel }: { product: any, onAdd: (details: any, price: number) => void, onCancel: () => void }) {
  const [rows, setRows] = useState([
    { id: '1', objectType: 'Sofá de 2 lugares', quantity: 1, unitPrice: product.price, subtotal: product.price, observation: '' }
  ]);
  const [technicalNotes, setTechnicalNotes] = useState('');

  const handleRowChange = (id: string, field: string, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedRow.subtotal = Number(updatedRow.quantity) * Number(updatedRow.unitPrice);
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: Math.random().toString(), objectType: '', quantity: 1, unitPrice: 0, subtotal: 0, observation: '' }]);
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const totalCalculated = rows.reduce((acc: number, curr: any) => acc + curr.subtotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ rows, technicalNotes }, totalCalculated);
  };

  const options = ["Sofá de 2 lugares", "Sofá de 3 lugares", "Sofá retrátil", "Poltrona", "Cadeira estofada", "Colchão casal"];

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="mb-6 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border">
        <div className="flex items-center gap-3 text-brand-900">
          <Sparkles size={24} className="animate-pulse" />
          <h3 className="text-lg font-black uppercase tracking-tight">Serviço de Higienização</h3>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-10 gap-2 border-brand-200 hover:bg-brand-50 rounded-xl font-bold uppercase text-[10px]">
          <Plus className="h-4 w-4"/> Adicionar Item
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-1 space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-start gap-4 p-5 border-2 border-slate-100 rounded-2xl bg-white relative group hover:border-brand-200 transition-all shadow-sm">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1.5">
                        <ArrowRight size={10} className="text-brand-900" /> Objeto
                      </label>
                      <Input 
                        list="objects-list" 
                        value={row.objectType} 
                        onChange={(e) => handleRowChange(row.id, 'objectType', e.target.value)} 
                        required 
                        placeholder="Ex: Sofá..." 
                        className="h-11 rounded-xl bg-slate-50 focus:bg-white"
                      />
                      <datalist id="objects-list">{options.map(o => <option key={o} value={o}/>)}</datalist>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Qtd</label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={row.quantity} 
                        onChange={(e) => handleRowChange(row.id, 'quantity', Number(e.target.value))} 
                        required 
                        className="h-11 rounded-xl bg-slate-50 focus:bg-white text-center font-bold" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Valor Unitário</label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={row.unitPrice} 
                        onChange={(e) => handleRowChange(row.id, 'unitPrice', Number(e.target.value))} 
                        required 
                        className="h-11 rounded-xl bg-slate-50 focus:bg-white font-bold" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-slate-400" />
                    <Input 
                      placeholder="Observação (Ex: Mancha persistente no braço direito...)" 
                      className="h-10 text-xs bg-transparent border-dashed rounded-lg" 
                      value={row.observation} 
                      onChange={(e) => handleRowChange(row.id, 'observation', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 pt-6 min-w-[120px]">
                  <div className="text-sm font-black text-brand-950 bg-brand-50 px-3 py-1 rounded-full">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.subtotal)}
                  </div>
                  {rows.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 px-1">
            <Info size={16} className="text-brand-900" /> Observações Gerais do Serviço
          </label>
          <textarea 
            value={technicalNotes} 
            onChange={e => setTechnicalNotes(e.target.value)} 
            className="flex min-h-[100px] w-full rounded-2xl border-2 border-slate-100 bg-white px-4 py-3 text-sm focus:border-brand-900 transition-all outline-none" 
            placeholder="Detalhes sobre acesso, manchas críticas, pelo de animais..."
          ></textarea>
        </div>

        <div className="mt-8 p-8 bg-brand-950 text-white rounded-[40px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-brand-400 font-black text-sm uppercase tracking-widest">Investimento Total</h4>
            <p className="text-xs text-slate-400">Calculado com base em {rows.length} item(s)</p>
          </div>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-black tracking-tighter text-brand-50">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCalculated)}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t px-2">
          <Button variant="ghost" type="button" onClick={onCancel} className="h-12 px-6 font-bold uppercase text-xs">
            Cancelar
          </Button>
          <Button type="submit" className="h-12 px-8 bg-brand-900 hover:bg-brand-800 text-white font-black uppercase text-xs flex items-center gap-2 rounded-xl shadow-lg shadow-brand-900/20">
            Adicionar à Venda <ShoppingCart size={18} />
          </Button>
        </div>
      </form>
    </div>
  )
}
