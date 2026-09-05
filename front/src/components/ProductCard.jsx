import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useCart } from "../contexts/CartContext";

function getImageUrl(product) {
  const img = product.images?.[0];
  if (!img) return null;
  return typeof img === "string" ? img : img.url;
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const imageUrl = getImageUrl(product);

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1); // o próprio contexto decide se abre o modal ou adiciona
  }

  return (
    <Link
      to={`/joias/${product.slug}`}
      className="group block bg-forest-900 rounded-lg overflow-hidden border border-gold-500/10 hover:border-gold-500/40 transition-colors"
    >
      <div className="relative aspect-square bg-forest-800 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="font-display text-3xl text-gold-500/40">JW</span>
        )}

        <button
          onClick={handleAdd}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-cream/95 text-forest-950 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 hover:bg-cream"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-widest text-gold-400 mb-1">{product.category}</p>
        <h3 className="font-display text-lg text-cream">{product.name}</h3>
        <p className="text-gold-300 mt-1 font-body text-sm">
          {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>
    </Link>
  );
}