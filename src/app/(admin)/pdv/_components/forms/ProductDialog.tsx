"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MattressReformForm } from "./MattressReformForm";
import { BoxReformForm } from "./BoxReformForm";
import { NewMattressForm } from "./NewMattressForm";
import { NewBoxForm } from "./NewBoxForm";
import { UpholsteryCleaningForm } from "./UpholsteryCleaningForm";
import { usePos } from "../PosContext";

interface ProductDialogProps {
  product: any | null;
  onClose: () => void;
}

export function ProductDialog({ product, onClose }: ProductDialogProps) {
  const { addItem } = usePos();

  if (!product) return null;

  const handleAdd = (details: any, finalPrice: number) => {
    addItem({
      id: Math.random().toString(),
      productServiceId: product.id,
      name: product.name,
      type: product.category,
      originalPrice: product.price,
      unitPrice: finalPrice,
      quantity: 1, // Limpeza de estofados gerencia a QTD dentro do details, mas a venda base é 1 serviço
      discountAmount: 0,
      totalAmount: finalPrice,
      details,
    });
    onClose();
  };

  const renderForm = () => {
    switch (product.category) {
      case 'Reforma Colchão':
      case 'Reforma de colchão':
        return <MattressReformForm product={product} onAdd={handleAdd} onCancel={onClose} />;
      case 'Reforma Box':
      case 'Reforma de box':
        return <BoxReformForm product={product} onAdd={handleAdd} onCancel={onClose} />;
      case 'Colchão Novo':
      case 'Colchão novo':
        return <NewMattressForm product={product} onAdd={handleAdd} onCancel={onClose} />;
      case 'Box Novo':
      case 'Box novo':
        return <NewBoxForm product={product} onAdd={handleAdd} onCancel={onClose} />;
      case 'Limpeza Estofados':
      case 'Limpeza de estofados':
      case 'Higienização de estofados':
      case 'Impermeabilização de estofados':
      case 'Impermeabilização':
      case 'Higienização':
        return <UpholsteryCleaningForm product={product} onAdd={handleAdd} onCancel={onClose} />;
      default:
        // Generic form fallback
        return (
          <div className="p-4 space-y-4">
             <p className="text-sm text-muted-foreground">Este produto não possui um formulário detalhado ainda. Deseja adicionar à venda diretamente?</p>
             <div className="flex justify-end gap-2">
               <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">Cancelar</button>
               <button onClick={() => handleAdd({}, product.price)} className="px-4 py-2 bg-brand-900 text-white rounded-md text-sm">Adicionar</button>
             </div>
          </div>
        )
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl rounded-2xl md:rounded-3xl p-4 md:p-6 max-h-[95vh] flex flex-col overflow-hidden gap-0">
        <DialogHeader className="text-left shrink-0 mb-4">
          <DialogTitle className="text-xl font-bold flex flex-col gap-1">
            <span>{product.name}</span>
            <span className="text-xs uppercase text-muted-foreground font-semibold">{product.category}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 text-foreground overflow-y-auto scrollbar-none custom-scrollbar">
          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
