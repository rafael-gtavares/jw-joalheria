import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

function getImageUrl(product) {
  const img = product.images?.[0];
  if (!img) return null;
  return typeof img === "string" ? img : img.url;
}

function getSecondImageUrl(product) {
  const img = product.images?.[1];
  if (!img) return null;
  return typeof img === "string" ? img : img.url;
}

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const imageUrl = getImageUrl(product);
  const hoverUrl = getSecondImageUrl(product);

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1); // o próprio contexto decide se abre o modal ou adiciona
  }

  return (
    <Link to={`/joias/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] bg-sand overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
                hoverUrl ? "group-hover:opacity-0" : "group-hover:scale-[1.04]"
              }`}
            />
            {hoverUrl && (
              <img
                src={hoverUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"
              />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-4xl text-stone/30">
            JW
          </span>
        )}

        <button
          onClick={handleAdd}
          aria-label={`Adicionar ${product.name} ao carrinho`}
          className="absolute inset-x-0 bottom-0 bg-paper/95 text-ink text-[11px] uppercase tracking-[0.24em] py-3.5 text-center translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-500 ease-out hover:bg-accent hover:text-paper"
        >
          Adicionar
        </button>
      </div>

      <div className="pt-4 text-center">
        <h3 className="font-display text-xl text-ink leading-snug">{product.name}</h3>
        <p className="text-stone mt-1 text-sm tracking-wide">
          {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>
    </Link>
  );
}
