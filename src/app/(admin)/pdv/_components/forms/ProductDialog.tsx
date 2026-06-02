"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MattressReformForm } from "./MattressReformForm";
import { BoxReformForm } from "./BoxReformForm";
import { NewMattressForm } from "./NewMattressForm";
import { NewBoxForm } from "./NewBoxForm";
import { UpholsteryCleaningForm } from "./UpholsteryCleaningForm";
import { usePos } from "../PosContext";
import { ArrowLeft } from "lucide-react";

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
      <DialogContent className="w-screen h-[100dvh] max-w-none m-0 sm:m-auto sm:w-[95vw] sm:max-w-3xl rounded-none sm:rounded-3xl p-0 sm:p-6 sm:max-h-[95vh] flex flex-col overflow-hidden gap-0 border-none sm:border-solid bg-slate-50 sm:bg-background [&>button]:hidden sm:[&>button]:flex">
        <DialogHeader className="flex flex-row items-center gap-3 p-4 sm:p-0 bg-white sm:bg-transparent border-b sm:border-none shrink-0 mb-0 sm:mb-4">
          <button onClick={onClose} className="sm:hidden p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col gap-0.5 flex-1 text-left">
            <DialogTitle className="text-lg sm:text-xl font-bold leading-tight text-slate-900 sm:text-foreground">
              {product.name}
            </DialogTitle>
            <span className="text-[10px] uppercase text-brand-900 sm:text-muted-foreground font-black tracking-widest">{product.category}</span>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 text-foreground overflow-y-auto scrollbar-none custom-scrollbar p-2 sm:p-0 bg-slate-50 sm:bg-transparent">
          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
