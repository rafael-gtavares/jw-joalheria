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
  const initialCategory = searchParams.get("category");
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(
    CATEGORIES.includes(initialCategory) ? initialCategory : "Todas"
  );
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
    <section className="bg-paper min-h-screen pt-14 md:pt-20 pb-28">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        <RevealOnScroll className="text-center mb-14">
          <p className="label mb-4">{collection ? `Coleção ${collection}` : "JW Joalheria Autoral"}</p>
          <h1 className="heading">Nossas peças</h1>
        </RevealOnScroll>

        {/* Categorias */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center mb-10 border-b border-line pb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[11px] uppercase tracking-[0.24em] pb-1.5 border-b transition-colors duration-300 ${
                category === c
                  ? "border-ink text-ink"
                  : "border-transparent text-stone hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Busca, preço e ordenação */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <label className="block">
            <span className="label">Buscar</span>
            <input
              type="text"
              placeholder="Nome da peça"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field mt-1"
            />
          </label>

          <label className="block">
            <span className="label">Preço</span>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="field mt-1 cursor-pointer"
            >
              {PRICE_RANGES.map((r, i) => (
                <option key={r.label} value={i}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="field mt-1 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="text-center text-stone py-24">Carregando peças...</p>
        ) : visibleProducts.length === 0 ? (
          <p className="text-center text-stone py-24">
            Nenhuma peça encontrada com esse filtro.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
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
