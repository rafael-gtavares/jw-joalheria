import React from "react";
import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/joias/${product.slug}`}
      className="group block bg-forest-900 rounded-lg overflow-hidden border border-gold-500/10 hover:border-gold-500/40 transition-colors"
    >
      <div className="aspect-square bg-forest-800 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="font-display text-3xl text-gold-500/40">JW</span>
        )}
      </div>
      <div className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-widest text-gold-400 mb-1">
          {product.category}
        </p>
        <h3 className="font-display text-lg text-cream">{product.name}</h3>
        <p className="text-gold-300 mt-1 font-body text-sm">
          {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>
    </Link>
  );
}
