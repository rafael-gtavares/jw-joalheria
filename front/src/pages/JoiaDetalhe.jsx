import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
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
      <div className="min-h-[60vh] bg-paper flex items-center justify-center text-ink px-6">
        <div className="text-center">
          <p className="font-display text-3xl mb-6">Peça não encontrada</p>
          <Link to="/joias" className="link-line">
            Voltar para as peças
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] bg-paper flex items-center justify-center text-stone">
        Carregando...
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const currentImage = getImageUrl(images[activeImage]);
  const outOfStock = product.stock <= 0;

  return (
    <section className="bg-paper pt-8 md:pt-12 pb-28">
      <div className="max-w-6xl mx-auto px-5 md:px-6">
        <nav aria-label="Navegação" className="mb-8 text-[11px] uppercase tracking-[0.24em] text-stone">
          <Link to="/joias" className="hover:text-ink transition-colors">Peças</Link>
          <span className="mx-3">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-16 items-start">
          {/* Galeria */}
          <div className="md:grid md:grid-cols-[72px_1fr] md:gap-4">
            {images.length > 1 && (
              <div className="order-2 md:order-1 flex md:flex-col gap-3 mt-3 md:mt-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    className={`w-16 h-20 md:w-[72px] md:h-[90px] overflow-hidden bg-sand transition-opacity duration-300 border ${
                      activeImage === i ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div
              className={`order-1 md:order-2 aspect-[4/5] bg-sand overflow-hidden flex items-center justify-center ${
                images.length > 1 ? "" : "md:col-span-2"
              }`}
            >
              {currentImage ? (
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover animate-fadeIn"
                />
              ) : (
                <span className="font-display text-6xl text-stone/30">JW</span>
              )}
            </div>
          </div>

          {/* Informações */}
          <div className="md:sticky md:top-32">
            <p className="label mb-4">{product.category}</p>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.1] text-ink mb-5">
              {product.name}
            </h1>
            <p className="text-ink text-xl tracking-wide mb-8">
              {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>

            <div className="h-px bg-line mb-8" />

            <p className="text-ink/80 leading-relaxed mb-8">{product.description}</p>

            <dl className="text-sm space-y-2 mb-10">
              <div className="flex gap-4">
                <dt className="label w-24 pt-0.5">Material</dt>
                <dd className="text-ink/80">{product.material}</dd>
              </div>
              <div className="flex gap-4">
                <dt className="label w-24 pt-0.5">Estoque</dt>
                <dd className={outOfStock ? "text-red-800" : "text-ink/80"}>
                  {outOfStock
                    ? "Sob encomenda / indisponível no momento"
                    : `${product.stock} em estoque`}
                </dd>
              </div>
            </dl>

            <div className="flex items-center gap-4 mb-5">
              <span className="label">Quantidade</span>
              <div className="flex items-center border border-line">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="w-10 h-10 flex items-center justify-center text-ink hover:bg-sand transition-colors"
                >
                  <Minus size={14} strokeWidth={1.5} />
                </button>
                <span className="text-ink w-10 text-center text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar quantidade"
                  className="w-10 h-10 flex items-center justify-center text-ink hover:bg-sand transition-colors"
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => addItem(product, quantity)} className="btn w-full">
                Adicionar ao carrinho
              </button>
              <a
                href={buildProductInterestWhatsappUrl(product)}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost w-full"
              >
                Tirar dúvidas no WhatsApp
              </a>
            </div>

            <p className="text-stone text-xs mt-8 leading-relaxed">
              6x sem juros no cartão de crédito · 5% de desconto no Pix. Frete calculado no carrinho.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
