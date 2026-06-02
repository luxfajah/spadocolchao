"use client";

import { useState } from "react";
import { ArrowUpRight, Package2, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductDialog } from "./forms/ProductDialog";
import { usePos } from "./PosContext";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function PosCatalog() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const { initialData } = usePos();

  const dbProducts =
    initialData?.products?.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.operationalCategory || product.type || "Produto geral",
      price: product.defaultPrice || 0,
    })) || [];

  const categories = ["Todos", ...Array.from(new Set<string>(dbProducts.map((product: any) => product.category)))];

  const filteredProducts = dbProducts.filter((product: any) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.category.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl lg:rounded-[2rem] border border-white/70 bg-white/85 shadow-sm backdrop-blur-sm">
      <div className="border-b border-slate-100/80 p-3 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/15">
              <Package2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Catálogo</p>
              <h3 className="text-base font-black tracking-tight text-primary">Produtos</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
              {dbProducts.length} itens
            </div>
          </div>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar produto..."
            className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-primary shadow-inner focus-visible:ring-primary/15"
          />
        </div>
      </div>

      <div className="border-b border-slate-100/70 px-3 py-2.5 sm:px-5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={category === activeCategory ? "default" : "ghost"}
              onClick={() => setActiveCategory(category)}
              className={`h-8 shrink-0 rounded-full px-3 text-[9px] font-black uppercase tracking-[0.18em] ${
                category === activeCategory
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-primary"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
        {filteredProducts.length === 0 ? (
          <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-black text-primary">Nenhum item encontrado</h4>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Ajuste a busca ou troque a categoria para encontrar o produto certo sem perder o ritmo do
              atendimento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product: any) => (
              <button
                type="button"
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group relative flex min-h-[140px] lg:min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl lg:rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 lg:p-4 text-left shadow-sm lg:shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_28px_60px_-30px_rgba(0,34,66,0.35)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_35%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex w-full items-start justify-between gap-1">
                  <div className="rounded-full bg-primary/5 px-2 py-1 lg:px-3 lg:py-1.5 text-[8px] lg:text-[10px] font-black uppercase tracking-widest lg:tracking-[0.2em] text-primary truncate max-w-full">
                    {product.category}
                  </div>
                  <ArrowUpRight className="hidden lg:block h-5 w-5 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary shrink-0" />
                </div>

                <div className="relative my-3 lg:my-6 flex-1 flex flex-col justify-center">
                  <p className="text-sm lg:text-xl font-black leading-tight tracking-tight text-primary line-clamp-3">{product.name}</p>
                  <p className="hidden lg:block mt-3 max-w-[18rem] text-sm text-slate-500">
                    Toque para configurar valores, medidas e detalhes do item antes de adicionar ao
                    carrinho.
                  </p>
                </div>

                <div className="relative flex w-full items-end justify-between gap-2 border-t border-slate-100 lg:border-none pt-2 lg:pt-0">
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preço base</p>
                    <p className="mt-0.5 lg:mt-1 font-outfit text-base lg:text-2xl font-black tracking-tight text-primary">
                      {formatBRL(product.price)}
                    </p>
                  </div>
                  <div className="hidden lg:block rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors group-hover:border-primary/20 group-hover:text-primary">
                    Abrir item
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <ProductDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
