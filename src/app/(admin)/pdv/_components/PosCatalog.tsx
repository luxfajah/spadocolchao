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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-lahomes backdrop-blur-sm">
      <div className="border-b border-slate-100/80 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-primary text-white shadow-lg shadow-primary/15">
                <Package2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Catalogo</p>
                <h3 className="text-2xl font-black tracking-tight text-primary">Escolha um produto ou servico</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {dbProducts.length} itens ativos
              </div>
              <div className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary">
                {Math.max(categories.length - 1, 0)} categorias
              </div>
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome ou categoria"
              className="h-12 rounded-[1.2rem] border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-primary shadow-inner focus-visible:ring-primary/15"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100/70 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={category === activeCategory ? "default" : "ghost"}
              onClick={() => setActiveCategory(category)}
              className={`h-10 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.18em] ${
                category === activeCategory
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product: any) => (
              <button
                type="button"
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_28px_60px_-30px_rgba(0,34,66,0.35)]"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_35%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {product.category}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>

                <div className="relative my-6 flex-1">
                  <p className="text-xl font-black leading-tight tracking-tight text-primary">{product.name}</p>
                  <p className="mt-3 max-w-[18rem] text-sm text-slate-500">
                    Toque para configurar valores, medidas e detalhes do item antes de adicionar ao
                    carrinho.
                  </p>
                </div>

                <div className="relative flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preco base</p>
                    <p className="mt-1 font-outfit text-2xl font-black tracking-tight text-primary">
                      {formatBRL(product.price)}
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors group-hover:border-primary/20 group-hover:text-primary">
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
