"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BoxCustomizationForm } from "./BoxCustomizationForm";
import { MattressCustomizationForm } from "./MattressCustomizationForm";
import { StandardProductCustomizationForm } from "./StandardProductCustomizationForm";
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

  const handleAdd = (details: any, finalPrice: number, quantity: number = 1) => {
    addItem({
      id: Math.random().toString(),
      productServiceId: product.id,
      name: product.name,
      type: product.category,
      originalPrice: product.price,
      minimumPrice: product.minimumPrice || 0,
      unitPrice: finalPrice,
      quantity: quantity,
      discountAmount: Math.max(0, (product.price - finalPrice) * quantity),
      totalAmount: finalPrice * quantity,
      allowPriceChangeInPDV: product.allowPriceChangeInPDV ?? true,
      requirePriceChangeJustification: product.requirePriceChangeJustification ?? false,
      details,
    });
    onClose();
  };

  const renderForm = () => {
    const categoryLower = (product.category || "").toLowerCase();
    const nameLower = (product.name || "").toLowerCase();

    // 1. Limpeza / Higienização de Estofados
    const isCleaning = categoryLower.includes("limpeza") 
      || categoryLower.includes("higienização") 
      || categoryLower.includes("impermeabilização");

    if (isCleaning) {
      return <UpholsteryCleaningForm product={product} onAdd={(details, price) => handleAdd(details, price, 1)} onCancel={onClose} />;
    }

    // 2. Box Novos (Box Life MDF, Box Baú Sienna, Box Spá Levitá)
    // Exclusivo para os box novos, e não para reformas
    const isReforma = categoryLower.includes("reforma") || nameLower.includes("reforma");
    const isBoxNovo = (categoryLower.includes("box") || nameLower.includes("box") || categoryLower.includes("baú") || nameLower.includes("baú")) && !isReforma;

    if (isBoxNovo) {
      return <BoxCustomizationForm product={product} onAdd={handleAdd} onCancel={onClose} />;
    }

    // 3. Colchões (SPA Essencial, Supreme, Magnus, Pilow Top e Reforma de Colchão)
    // Camada extra de espuma + Tecido Tampo + Tecido Lateral + Fitilhos
    const isColchao = categoryLower.includes("colchão") || nameLower.includes("colchão") || categoryLower.includes("pilow") || nameLower.includes("pilow");

    if (isColchao) {
      return <MattressCustomizationForm product={product} onAdd={handleAdd} onCancel={onClose} />;
    }

    // 4. Demais reformas (Reforma de Box, Reforma de Conjunto) e produtos gerais
    return <StandardProductCustomizationForm product={product} onAdd={handleAdd} onCancel={onClose} />;
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-screen h-[100dvh] max-w-none m-0 sm:m-auto sm:w-[95vw] sm:max-w-3xl rounded-none sm:rounded-3xl p-0 sm:p-6 sm:max-h-[95vh] flex flex-col overflow-hidden gap-0 border-none sm:border-solid bg-slate-50 sm:bg-background [&>button]:hidden sm:[&>button]:flex">
        <DialogHeader className="flex flex-row items-center gap-3 p-4 sm:p-0 bg-white sm:bg-transparent border-b sm:border-none shrink-0 mb-0 sm:mb-4">
          <button onClick={onClose} className="sm:hidden p-2 -ml-2 text-slate-500 active:bg-slate-100 rounded-full transition-colors" aria-label="Voltar">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col gap-0.5 flex-1 text-left">
            <DialogTitle className="text-lg sm:text-xl font-bold leading-tight text-slate-900 sm:text-foreground">
              {product.name}
            </DialogTitle>
            <span className="text-[10px] uppercase text-brand-900 sm:text-muted-foreground font-black tracking-widest">{product.category}</span>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 text-foreground overflow-y-auto scrollbar-none custom-scrollbar p-2 pt-6 sm:p-0 bg-slate-50 sm:bg-transparent">
          {renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
