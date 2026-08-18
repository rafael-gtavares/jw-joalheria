import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import RevealOnScroll from "../components/RevealOnScroll";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    api.getProducts({ featured: "true" }).then(setFeatured).catch(() => {});
    api.getFeedback().then(setFeedback).catch(() => {});
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative bg-forest-950 text-cream overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,162,75,0.12),_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-24 text-center flex flex-col items-center">
          <span className="flex items-center justify-center w-20 h-20 rounded-full border border-gold-400 text-gold-300 font-display text-3xl mb-6">
            JW
          </span>
          <p className="uppercase tracking-[0.35em] text-gold-400 text-xs mb-4">
            Joalheria Autoral
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6">
            Joias exclusivas,
            <br /> feitas à mão
          </h1>
          <p className="text-cream/70 max-w-xl mx-auto mb-10 font-body">
            Cada peça nasce de um desejo enorme de levar arte e eternizar
            momentos — com exclusividade e muito amor.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              to="/joias"
              className="bg-gold-500 hover:bg-gold-400 text-forest-950 font-body font-medium px-8 py-3 rounded-full transition-colors"
            >
              Ver peças
            </Link>
            <a
              href="#sobre"
              className="border border-gold-400/50 text-cream hover:bg-cream/5 font-body px-8 py-3 rounded-full transition-colors"
            >
              Conhecer a JW
            </a>
          </div>
        </div>
      </section>

      {/* SOBRE MIM */}
      <section id="sobre" className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <RevealOnScroll>
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-forest-900 border border-gold-500/20">
              <img
                src="/janayna.jpg"
                alt="Janayna Waite, fundadora da JW Joalheria Autoral"
                className="w-full h-full object-cover"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={150}>
            <p className="uppercase tracking-[0.3em] text-gold-600 text-xs mb-3">
              Sobre mim
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-forest-950 mb-5">
              Sejam bem vindos ao meu sonho!
            </h2>
            <div className="font-body text-ink/80 leading-relaxed space-y-4 text-[15px]">
              <p>
                Vou me apresentar... sou Janayna Waite! Mãe de uma calopsita
                que se chama Hebe, formada em Marketing, bancária há 12 anos,
                aluna de Ourivesaria na @parque.design e uma eterna amante da
                arte de criar acessórios!
              </p>
              <p>
                Já fiz bijuterias, criava e montava semijoias, mas sempre
                tive uma paixão e um sonho! Paixão por fazer peças exclusivas
                e o sonho de aprender a fazer joias. Mas com a correria da
                vida fui deixando esse sonho de lado.
              </p>
              <p>
                Aos 42 anos resolvi acordar aquele sonho adormecido, já que a
                paixão nunca deixou de existir! E foi assim que nasceu a JW!
                Fruto de um desejo enorme de levar minha arte e de eternizar
                momentos em forma de joias, com exclusividade e muito amor.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* PEÇAS EM DESTAQUE */}
      <section className="bg-forest-950 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">
              Coleção
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-cream">
              Peças em destaque
            </h2>
          </RevealOnScroll>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p, i) => (
              <RevealOnScroll key={p._id} delay={i * 100}>
                <ProductCard product={p} />
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll className="text-center mt-12">
            <Link
              to="/joias"
              className="inline-block border border-gold-400 text-gold-300 hover:bg-gold-500/10 font-body px-8 py-3 rounded-full transition-colors"
            >
              Ver todas as peças
            </Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* AVALIAÇÕES */}
      {feedback.length > 0 && (
        <section className="bg-cream py-24">
          <div className="max-w-5xl mx-auto px-6">
            <RevealOnScroll className="text-center mb-12">
              <p className="uppercase tracking-[0.3em] text-gold-600 text-xs mb-3">
                Clientes JW
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-forest-950">
                Quem já viveu essa experiência
              </h2>
            </RevealOnScroll>

            <div className="grid md:grid-cols-3 gap-6">
              {feedback.slice(0, 6).map((f, i) => (
                <RevealOnScroll key={f._id} delay={i * 100}>
                  <div className="bg-white border border-forest-900/10 rounded-lg p-6 h-full">
                    <div className="text-gold-500 mb-2 text-sm">
                      {"★".repeat(f.rating)}
                      {"☆".repeat(5 - f.rating)}
                    </div>
                    <p className="text-ink/80 text-sm leading-relaxed mb-4">
                      “{f.message}”
                    </p>
                    <p className="font-display text-forest-900 text-lg">
                      {f.customerName}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTATO */}
      <section id="contato" className="bg-forest-900 py-20">
        <RevealOnScroll className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl text-cream mb-4">
            Vamos criar sua peça exclusiva?
          </h2>
          <p className="text-cream/70 mb-8 font-body">
            Fale direto com a Janayna pelo WhatsApp e conte qual momento você
            quer eternizar em joia.
          </p>
          <a
            href="https://wa.me/5521999079400"
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-gold-500 hover:bg-gold-400 text-forest-950 font-body font-medium px-8 py-3 rounded-full transition-colors"
          >
            Falar com Janayna
          </a>
        </RevealOnScroll>
      </section>
    </>
  );
}
