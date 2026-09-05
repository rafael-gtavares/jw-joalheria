import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import ProductCard from "../components/ProductCard";
import RevealOnScroll from "../components/RevealOnScroll";
import { CATEGORIES_WITH_ALL as CATEGORIES } from "../constants/categories";

const PRICE_RANGES = [
  { label: "Todos os preços", min: 0, max: Infinity },
  { label: "Até R$ 200", min: 0, max: 200 },
  { label: "R$ 200 – R$ 300", min: 200, max: 300 },
  { label: "R$ 300 – R$ 500", min: 300, max: 500 },
  { label: "Acima de R$ 500", min: 500, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "menor", label: "Menor preço" },
  { value: "maior", label: "Maior preço" },
];

export default function Joias() {
  const [searchParams] = useSearchParams();
  const collection = searchParams.get("collection") || "";
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState(0);
  const [sort, setSort] = useState("recentes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== "Todas") params.category = category;
    if (search) params.search = search;
    if (collection) params.collection = collection;

    const timeout = setTimeout(() => {
      productApi
        .list(params)
        .then(setProducts)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [category, search, collection]);

  // Filtro de preço + ordenação aplicados no cliente
  const visibleProducts = useMemo(() => {
    const range = PRICE_RANGES[priceRange];
    let list = products.filter(
      (p) => p.price >= range.min && p.price <= range.max
    );

    if (sort === "menor") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "maior") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, priceRange, sort]);

  return (
    <section className="bg-forest-950 min-h-screen pt-16 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <RevealOnScroll className="text-center mb-12">
          <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">JW Joalheria Autoral</p>
          <h1 className="font-display text-4xl md:text-5xl text-cream">Nossas peças</h1>
        </RevealOnScroll>

        {/* Categorias + busca */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-body border transition-colors ${
                  category === c
                    ? "bg-gold-500 border-gold-500 text-forest-950"
                    : "border-gold-500/30 text-cream/70 hover:border-gold-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Buscar peça..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-forest-900 border border-gold-500/20 focus:border-gold-400 outline-none rounded-full px-5 py-2 text-cream placeholder:text-cream/40 text-sm w-full md:w-64"
          />
        </div>

        {/* Filtros por preço + ordenação */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-10 border-t border-gold-500/10 pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-cream/50 text-xs uppercase tracking-widest mr-1">
              Preço
            </span>
            {PRICE_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setPriceRange(i)}
                className={`px-4 py-1.5 rounded-full text-xs font-body border transition-colors ${
                  priceRange === i
                    ? "bg-gold-500 border-gold-500 text-forest-950"
                    : "border-gold-500/30 text-cream/70 hover:border-gold-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cream/50 text-xs uppercase tracking-widest">
              Ordenar
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-forest-900 border border-gold-500/20 focus:border-gold-400 outline-none rounded-full px-4 py-2 text-cream text-sm cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-forest-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-cream/50 py-20 font-body">Carregando peças...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="text-center text-cream/50 py-20 font-body">
            Nenhuma peça encontrada com esse filtro.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {visibleProducts.map((p, i) => (
              <RevealOnScroll key={p._id} delay={(i % 4) * 80}>
                <ProductCard product={p} />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
