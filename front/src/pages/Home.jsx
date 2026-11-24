import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { announcementApi } from "../api/announcementApi";
import ProductCard from "../components/ProductCard";
import RevealOnScroll from "../components/RevealOnScroll";
import Marquee from "../components/Marquee";
import Carousel from "../components/Carousel";
import { WHATSAPP_LINK } from "../helpers/whatsapp";
import { COLLECTIONS, CATEGORIES } from "../constants/categories";

// Texto institucional provisório — ajuste com informações reais da marca
// quando disponíveis. Está isolado aqui para facilitar a substituição futura.
const DIFERENCIAIS = [
  {
    n: "01",
    title: "Design autoral",
    text: "Cada peça nasce de um desenho próprio, sem réplicas — uma identidade que é só da JW.",
  },
  {
    n: "02",
    title: "Feita à mão",
    text: "Produção artesanal, com atenção ao detalhe em cada etapa do processo.",
  },
  {
    n: "03",
    title: "Materiais nobres",
    text: "Prata 950 e banho de ouro 18k, com pedras como ágata, ametista, madrepérola e quartzo.",
  },
  {
    n: "04",
    title: "Feito com intenção",
    text: "Peças pensadas para eternizar momentos, com dedicação e cuidado em cada exemplar.",
  },
];

// Imagens provisórias das coleções (substituir pelas fotos finais da marca).
const COLLECTION_IMAGES = {
  Origem: "/products/anel-ondas-do-mar.png",
  Bauhaus: "/products/brinco-argola-autoral.png",
};

function ReviewCard({ review: r }) {
  return (
    <div className="h-full flex flex-col">
      {r.image?.url && (
        <div className="w-full aspect-[4/5] bg-sand overflow-hidden mb-5">
          <img
            src={r.image.url}
            alt={`${r.customerName} usando joia JW`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="text-brass mb-3 text-sm tracking-widest">
        {"★".repeat(r.rating)}
        <span className="text-line">{"★".repeat(5 - r.rating)}</span>
      </div>

      <p className="font-display italic text-xl leading-snug text-ink mb-4 flex-1">
        “{r.message}”
      </p>

      <p className="label">{r.customerName}</p>
    </div>
  );
}

function AnnouncementCard({ announcement: a }) {
  return (
    <div className="h-full flex flex-col bg-white border border-line">
      {a.image?.url && (
        <div className="w-full aspect-[4/1] bg-sand flex-shrink-0 overflow-hidden">
          <img
            src={a.image.url}
            alt={a.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        <h3 className="font-display text-2xl text-ink mb-3">{a.title}</h3>
        <p className="text-stone text-sm leading-relaxed flex-1">{a.content}</p>
      </div>
    </div>
  );
}

function SectionTitle({ label, title, className = "" }) {
  return (
    <RevealOnScroll className={`text-center mb-14 ${className}`}>
      <p className="label mb-4">{label}</p>
      <h2 className="heading">{title}</h2>
    </RevealOnScroll>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    productApi.list({ featured: "true" }).then(setFeatured).catch(() => { });
    reviewApi.listPublic().then(setReviews).catch(() => { });
    announcementApi.listPublic().then(setAnnouncements).catch(() => { });
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative bg-accent text-paper overflow-hidden min-h-[78vh] md:min-h-[86vh] flex items-end">
        <img
          src="/products/colar-ponto-de-luz.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <div className="relative w-full max-w-6xl mx-auto px-6 pb-16 md:pb-24">
          <p className="animate-fadeUp text-[11px] uppercase tracking-[0.4em] text-paper/80 mb-5">
            Janayna Waite · Joalheria Autoral
          </p>
          <h1 className="animate-fadeUp [animation-delay:150ms] font-display font-light text-5xl md:text-7xl leading-[1.04] max-w-2xl">
            Joias autorais,
            <br />
            <span className="italic">feitas para durar.</span>
          </h1>
          <div className="animate-fadeUp [animation-delay:350ms] mt-10 flex gap-4 flex-wrap">
            <Link
              to="/joias"
              className="inline-flex items-center justify-center bg-paper text-ink px-9 py-3.5 text-[11px] uppercase tracking-[0.24em] hover:bg-sand transition-colors duration-300"
            >
              Ver peças
            </Link>
            <a
              href="#sobre"
              className="inline-flex items-center justify-center border border-paper/60 text-paper px-9 py-3.5 text-[11px] uppercase tracking-[0.24em] hover:bg-paper hover:text-ink transition-colors duration-300"
            >
              Conhecer a JW
            </a>
          </div>
        </div>
      </section>

      <Marquee className="bg-paper" />

      {/* CATEGORIAS */}
      <section className="bg-paper py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <SectionTitle label="Explorar" title="Por categoria" />

          <div className="flex flex-wrap justify-center gap-x-10 gap-y-5 md:gap-x-16">
            {CATEGORIES.map((c, i) => (
              <RevealOnScroll key={c} delay={i * 80}>
                <Link
                  to={`/joias?category=${encodeURIComponent(c)}`}
                  className="group font-display text-3xl md:text-4xl text-ink relative"
                >
                  {c}
                  <span className="absolute left-0 -bottom-1 h-px w-0 bg-ink transition-all duration-500 group-hover:w-full" />
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* PEÇAS EM DESTAQUE */}
      {featured.length > 0 && (
        <section className="bg-paper pb-24 md:pb-32">
          <div className="max-w-6xl mx-auto px-5 md:px-6">
            <SectionTitle label="Seleção" title="Peças em destaque" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
              {featured.map((p, i) => (
                <RevealOnScroll key={p._id} delay={i * 100}>
                  <ProductCard product={p} />
                </RevealOnScroll>
              ))}
            </div>

            <RevealOnScroll className="text-center mt-16">
              <Link to="/joias" className="btn-ghost">
                Ver todas as peças
              </Link>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* SOBRE */}
      <section id="sobre" className="bg-sand py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[0.9fr_1fr] gap-12 md:gap-20 items-center">
          <RevealOnScroll>
            <div className="aspect-[4/5] overflow-hidden bg-line">
              <img
                src="/janayna.jpeg"
                alt="Janayna Waite, fundadora da JW Joalheria Autoral"
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={150}>
            <p className="label mb-4">Sobre mim</p>

            <h2 className="heading mb-8">
              Sejam bem-vindos
              <br />
              <span className="italic">ao meu sonho</span>
            </h2>

            <div className="text-ink/80 leading-[1.8] space-y-4 text-[15px]">
              <p>
                Vou me apresentar: sou Janayna Waite. Mãe da Hebe, minha calopsita, formada em Marketing e bancária há 12 anos. Atualmente, sou aluna de Ourivesaria na @parque.design e, acima de tudo, uma eterna apaixonada pela arte de criar acessórios.
              </p>

              <p>
                Minha história com a criação começou há alguns anos. Já fiz bijuterias e criei e montei semijoias, mas sempre carreguei comigo uma paixão especial: criar peças autorais e aprender a transformar metais e pedras em verdadeiras joias.
              </p>

              <p>
                Entre a correria da vida e as responsabilidades do dia a dia, esse sonho acabou ficando adormecido. Até que, aos 42 anos, decidi finalmente despertar essa vontade que nunca deixou de existir.
              </p>

              <p>
                Foi assim que nasceu a JW: fruto de um sonho retomado, de uma paixão que resistiu ao tempo e do desejo de transformar minha arte em peças autorais, capazes de eternizar momentos e histórias. Tudo feito com dedicação, cuidado e, principalmente, muito amor.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* COLEÇÕES */}
      <section className="bg-paper py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5 md:px-6">
          <SectionTitle label="Explorar" title="Coleções" />

          <div className="grid sm:grid-cols-2 gap-5 md:gap-8">
            {COLLECTIONS.map((c, i) => (
              <RevealOnScroll key={c} delay={i * 120}>
                <Link
                  to={`/joias?collection=${encodeURIComponent(c)}`}
                  className="group relative block aspect-[4/5] sm:aspect-[5/6] overflow-hidden bg-accent"
                >
                  {COLLECTION_IMAGES[c] && (
                    <img
                      src={COLLECTION_IMAGES[c]}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-8 text-paper">
                    <p className="text-[11px] uppercase tracking-[0.35em] text-paper/80 mb-2">Coleção</p>
                    <span className="font-display italic text-5xl">{c}</span>
                    <span className="block mt-4 text-[11px] uppercase tracking-[0.24em] border-b border-paper/50 w-fit pb-1 group-hover:border-paper transition-colors">
                      Explorar
                    </span>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ANÚNCIOS */}
      {announcements.length > 0 && (
        <section id="anuncios" className="bg-sand py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <SectionTitle label="Novidades" title="Anúncios" />

            <RevealOnScroll>
              {/* Mobile: carrossel horizontal */}
              <Carousel itemClassName="w-[280px] sm:w-[320px]">
                {announcements.map((a) => (
                  <AnnouncementCard key={a._id} announcement={a} />
                ))}
              </Carousel>

              {/* Desktop: grid */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-6">
                {announcements.map((a) => (
                  <AnnouncementCard key={a._id} announcement={a} />
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* PROCESSO */}
      <section className="bg-paper py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <SectionTitle label="Nosso processo" title="Do desenho à peça" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-line">
            {DIFERENCIAIS.map((d, i) => (
              <RevealOnScroll
                key={d.title}
                delay={i * 100}
                className="py-10 lg:px-8 lg:first:pl-0 border-b border-line lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <p className="font-display italic text-brass text-2xl mb-4">{d.n}</p>
                <h3 className="font-display text-2xl text-ink mb-3">{d.title}</h3>
                <p className="text-stone text-sm leading-relaxed">{d.text}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* AVALIAÇÕES */}
      {reviews.length > 0 && (
        <section className="bg-sand py-24 md:py-32">
          <div className="max-w-6xl mx-auto px-6">
            <SectionTitle label="Clientes JW" title="Quem já viveu essa experiência" />

            <RevealOnScroll>
              {/* Mobile: carrossel horizontal */}
              <Carousel itemClassName="w-[280px] sm:w-[320px]">
                {reviews.slice(0, 6).map((r) => (
                  <ReviewCard key={r._id} review={r} />
                ))}
              </Carousel>

              {/* Desktop: grid fixo (máx. 6 avaliações) */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-x-10 md:gap-y-14">
                {reviews.slice(0, 6).map((r) => (
                  <ReviewCard key={r._id} review={r} />
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* LOJA FÍSICA */}
      <section className="bg-paper py-24 md:py-32">
        <RevealOnScroll className="max-w-4xl mx-auto px-6">
          <SectionTitle label="Visite a loja" title="Agora também com endereço físico" className="!mb-12" />

          <div className="grid sm:grid-cols-2 border border-line bg-white">
            <div className="p-8 md:p-10 sm:border-r border-b sm:border-b-0 border-line">
              <p className="label mb-5">Local</p>
              <p className="font-display text-2xl text-ink mb-2">Jardim Botânico</p>
              <p className="text-stone text-sm leading-relaxed">
                Rua Visconde de Carandaí, 28
                <br />
                Rio de Janeiro, RJ
              </p>
            </div>

            <div className="p-8 md:p-10">
              <p className="label mb-5">Horário</p>
              <div className="space-y-4">
                <div>
                  <p className="font-display text-2xl text-ink">Quarta a sexta</p>
                  <p className="text-stone text-sm">13h às 19h</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-ink">Sábado</p>
                  <p className="text-stone text-sm">13h às 17h</p>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* CONTATO */}
      <section id="contato" className="bg-accent text-paper py-24 md:py-28">
        <RevealOnScroll className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-paper/70 mb-5">Contato</p>
          <h2 className="font-display font-light text-4xl md:text-5xl leading-[1.1] mb-6">
            Vamos criar <span className="italic">sua peça exclusiva?</span>
          </h2>
          <p className="text-paper/75 mb-4 leading-relaxed">
            Fale direto com a Janayna pelo WhatsApp e conte qual momento você quer eternizar em joia,
            ou nos visite pessoalmente em nosso espaço no Jardim Botânico.
          </p>
          <p className="text-paper/50 text-xs mb-10">
            6x sem juros no cartão de crédito · 5% de desconto no Pix · Consultar forma de entrega.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center bg-paper text-ink px-10 py-3.5 text-[11px] uppercase tracking-[0.24em] hover:bg-sand transition-colors duration-300"
          >
            Falar com Janayna
          </a>
        </RevealOnScroll>
      </section>
    </>
  );
}
