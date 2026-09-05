import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { productApi } from "../api/productApi";
import { useCart } from "../contexts/CartContext";
import { buildProductInterestWhatsappUrl } from "../helpers/whatsapp";

function getImageUrl(img) {
  if (!img) return null;
  return typeof img === "string" ? img : img.url;
}

export default function JoiaDetalhe() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    productApi.get(slug).then(setProduct).catch(() => setNotFound(true));
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

  const images = product.images?.length ? product.images : [];
  const currentImage = getImageUrl(images[activeImage]);
  const outOfStock = product.stock <= 0;

  return (
    <section className="bg-forest-950 min-h-screen pt-16 pb-24">
      <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-forest-900 border border-gold-500/20 flex items-center justify-center">
            {currentImage ? (
              <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-5xl text-gold-500/40">JW</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`w-16 h-16 rounded-md overflow-hidden border ${
                    activeImage === i ? "border-gold-400" : "border-gold-500/20"
                  }`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">{product.category}</p>
          <h1 className="font-display text-4xl text-cream mb-4">{product.name}</h1>
          <p className="text-gold-300 text-2xl font-body mb-6">
            {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-cream/70 font-body leading-relaxed mb-6">{product.description}</p>
          <p className="text-cream/50 text-sm mb-2">Material: {product.material}</p>
          <p className={`text-sm mb-8 ${outOfStock ? "text-red-300" : "text-cream/50"}`}>
            {outOfStock ? "Peça sob encomenda / indisponível no momento" : `${product.stock} em estoque`}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 border border-gold-500/20 rounded-full px-4 py-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
                className="text-cream/70 hover:text-gold-400"
              >
                <Minus size={14} />
              </button>
              <span className="text-cream w-4 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
                className="text-cream/70 hover:text-gold-400"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => addItem(product, quantity)}
              className="flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 text-forest-950 font-body font-medium px-8 py-3 rounded-full transition-colors"
            >
              <ShoppingBag size={16} /> Adicionar ao carrinho
            </button>
            <a
              href={buildProductInterestWhatsappUrl(product)}
              target="_blank"
              rel="noreferrer"
              className="text-center border border-gold-400/50 text-cream hover:bg-cream/5 font-body px-8 py-3 rounded-full transition-colors"
            >
              Tirar dúvidas no WhatsApp
            </a>
          </div>

          <p className="text-cream/40 text-[11px] mt-6 leading-relaxed">
            6x sem juros no cartão de crédito · 5% de desconto no Pix. Consultar forma de entrega.
          </p>

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
