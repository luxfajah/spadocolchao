"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";

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

  const totalCalculated = rows.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ rows, technicalNotes }, totalCalculated);
  };

  const options = ["Sofá de 2 lugares", "Sofá de 3 lugares", "Sofá retrátil", "Poltrona", "Cadeira estofada", "Colchão casal"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="font-semibold text-sm">Objetos para Limpeza</h4>
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="h-8 gap-1"><Plus className="h-4 w-4"/> Adicionar Objeto</Button>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/5 relative group">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">Objeto</label>
                    <Input list="objects-list" value={row.objectType} onChange={(e) => handleRowChange(row.id, 'objectType', e.target.value)} required placeholder="Ex: Sofá..." className="h-9"/>
                    <datalist id="objects-list">{options.map(o => <option key={o} value={o}/>)}</datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">Qtd</label>
                    <Input type="number" min="1" value={row.quantity} onChange={(e) => handleRowChange(row.id, 'quantity', Number(e.target.value))} required className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">Valor Unid.</label>
                    <Input type="number" step="0.01" value={row.unitPrice} onChange={(e) => handleRowChange(row.id, 'unitPrice', Number(e.target.value))} required className="h-9" />
                  </div>
                </div>
                <div>
                  <Input placeholder="Observação deste item..." className="h-8 text-xs bg-transparent border-dashed" value={row.observation} onChange={(e) => handleRowChange(row.id, 'observation', e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 pt-5">
                <div className="font-bold text-brand-900 w-24 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.subtotal)}</div>
                {rows.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-muted-foreground">Observações Técnicas Gerais do Serviço</label>
        <textarea value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} className="flex min-h-[60px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500" placeholder="Manchas profundas, pelo de gato..."></textarea>
      </div>

      <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between shadow-sm">
        <div className="text-brand-950 font-semibold uppercase text-sm">Valor Total Formatado</div>
        <div className="text-right font-black text-2xl text-brand-900">
           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCalculated)}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="bg-brand-900 hover:bg-brand-800 text-white font-semibold shadow-md">Adicionar Itens à Venda</Button>
      </div>
    </form>
  )
}
