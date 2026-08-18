import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function JoiaDetalhe() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .getProduct(slug)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center text-cream">
        <div className="text-center">
          <p className="font-display text-2xl mb-4">Peça não encontrada</p>
          <Link to="/joias" className="text-gold-400 underline">
            Voltar para as peças
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center text-cream/60">
        Carregando...
      </div>
    );
  }

  const whatsappMsg = encodeURIComponent(
    `Olá Janayna! Tenho interesse na peça "${product.name}" da JW Joalheria.`
  );

  return (
    <section className="bg-forest-950 min-h-screen pt-16 pb-24">
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">
        <div className="aspect-square rounded-lg overflow-hidden bg-forest-900 border border-gold-500/20 flex items-center justify-center">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-5xl text-gold-500/40">JW</span>
          )}
        </div>

        <div>
          <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">
            {product.category}
          </p>
          <h1 className="font-display text-4xl text-cream mb-4">{product.name}</h1>
          <p className="text-gold-300 text-2xl font-body mb-6">
            {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-cream/70 font-body leading-relaxed mb-6">{product.description}</p>
          <p className="text-cream/50 text-sm mb-8">Material: {product.material}</p>

          <a
            href={`https://wa.me/5521999079400?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-gold-500 hover:bg-gold-400 text-forest-950 font-body font-medium px-8 py-3 rounded-full transition-colors"
          >
            Tenho interesse
          </a>

          <div className="mt-8">
            <Link to="/joias" className="text-gold-400 text-sm underline">
              ← Voltar para todas as peças
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
