import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Gem, Hammer, Sparkles, Heart, MapPin, Clock } from "lucide-react";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { announcementApi } from "../api/announcementApi";
import ProductCard from "../components/ProductCard";
import RevealOnScroll from "../components/RevealOnScroll";
import Marquee from "../components/Marquee";
import Carousel from "../components/Carousel";
import { WHATSAPP_LINK } from "../helpers/whatsapp";
import { COLLECTIONS } from "../constants/categories";

// Texto institucional provisório — ajuste com informações reais da marca
// quando disponíveis. Está isolado aqui para facilitar a substituição futura.
const DIFERENCIAIS = [
  {
    icon: Gem,
    title: "Design autoral",
    text: "Cada peça nasce de um desenho próprio, sem réplicas — uma identidade que é só da JW.",
  },
  {
    icon: Hammer,
    title: "Feita à mão",
    text: "Produção artesanal, com atenção ao detalhe em cada etapa do processo.",
  },
  {
    icon: Sparkles,
    title: "Materiais nobres",
    text: "Prata 950 e banho de ouro 18k, com pedras como ágata, ametista, madrepérola e quartzo.",
  },
  {
    icon: Heart,
    title: "Feito com intenção",
    text: "Peças pensadas para eternizar momentos, com dedicação e cuidado em cada exemplar.",
  },
];

function ReviewCard({ review: r }) {
  return (
    <div className="bg-cream border border-forest-900/10 rounded-lg overflow-hidden h-full flex flex-col">
      {r.image?.url && (
        <div className="w-full h-64 bg-forest-900/5 flex-shrink-0">
          <img
            src={r.image.url}
            alt={`${r.customerName} usando joia JW`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Estrelas */}
        <div className="text-gold-600 mb-2 text-sm h-5 flex items-center">
          {"★".repeat(r.rating)}
          {"☆".repeat(5 - r.rating)}
        </div>

        {/* Texto */}
        <p className="text-ink/80 text-sm leading-relaxed mb-4 flex-1">
          “{r.message}”
        </p>

        {/* Nome */}
        <p className="font-display text-forest-900 text-lg mt-auto">
          {r.customerName}
        </p>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement: a }) {
  return (
    <div className="bg-forest-900 border border-gold-500/20 rounded-2xl overflow-hidden h-full flex flex-col">
      {a.image?.url && (
        <div className="w-full aspect-[4/1] bg-forest-950 flex-shrink-0">
          <img
            src={a.image.url}
            alt={a.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-xl text-cream mb-2">{a.title}</h3>
        <p className="text-cream/70 text-sm leading-relaxed flex-1">{a.content}</p>
      </div>
    </div>
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
      <section className="relative bg-forest-950 text-cream overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(176,169,150,0.10),_transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center">
          <span className="flex items-center justify-center w-20 h-20 rounded-full bg-cream/95 mb-6 overflow-hidden">
            <img src="/jw-logo.png" alt="Logo JW" className="w-14 h-14 object-contain" />
          </span>
          <p className="uppercase tracking-[0.35em] text-gold-400 text-xs mb-4">
            Janayna Waite · Joalheria Autoral
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mb-6">
            Joias autorais,
            <br /> feitas para durar.
          </h1>
          <p className="text-cream/70 max-w-xl mx-auto mb-10 font-body">
            Peças autorais, desenhadas e produzidas com identidade própria —
            sofisticação sem excesso, para o seu dia a dia.
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

      <Marquee />
    </section >

      {/* SOBRE MIM */ }
      < section id = "sobre" className = "bg-cream py-24" >
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <RevealOnScroll>
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-forest-900 border border-gold-500/20">
              <img
                src="/janayna.jpeg"
                alt="Janayna Waite, fundadora da JW Joalheria Autoral"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={150}>
            <p className="uppercase tracking-[0.3em] text-gold-600 text-xs mb-3">Sobre mim</p>

            <h2 className="font-display text-3xl md:text-4xl text-forest-950 mb-5">
              Sejam bem-vindos ao meu sonho
            </h2>

            <div className="font-body text-ink/80 leading-relaxed space-y-4 text-[15px]">
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
      </section >

    {/* PEÇAS EM DESTAQUE */ }
  {
    featured.length > 0 && (
      <section className="bg-forest-950 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">Coleção</p>
            <h2 className="font-display text-3xl md:text-4xl text-cream">Peças em destaque</h2>
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
    )
  }

  {/* ANÚNCIOS */ }
  {
    announcements.length > 0 && (
      <section id="anuncios" className="bg-forest-900 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">Novidades</p>
            <h2 className="font-display text-3xl md:text-4xl text-cream">Anúncios</h2>
          </RevealOnScroll>

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
    )
  }

  {/* DIFERENCIAIS */ }
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-gold-600 text-xs mb-3">Nosso processo</p>
            <h2 className="font-display text-3xl md:text-4xl text-forest-950">
              Joalheria autoral, do desenho à peça
            </h2>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {DIFERENCIAIS.map((d, i) => (
              <RevealOnScroll key={d.title} delay={i * 100} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full border border-forest-900/15 flex items-center justify-center text-forest-900">
                  <d.icon size={22} />
                </div>
                <h3 className="font-display text-lg text-forest-950 mb-2">{d.title}</h3>
                <p className="text-ink/60 text-sm leading-relaxed">{d.text}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Marquee className="bg-forest-950" />

  {/* COLEÇÕES */ }
  <section className="bg-forest-950 py-24">
    <div className="max-w-5xl mx-auto px-6 text-center">
      <RevealOnScroll className="mb-12">
        <p className="uppercase tracking-[0.3em] text-gold-400 text-xs mb-3">Explorar</p>
        <h2 className="font-display text-3xl md:text-4xl text-cream">Coleções</h2>
      </RevealOnScroll>

      <div className="grid sm:grid-cols-2 gap-6">
        {COLLECTIONS.map((c, i) => (
          <RevealOnScroll key={c} delay={i * 120}>
            <Link
              to={`/joias?collection=${encodeURIComponent(c)}`}
              className="group block border border-gold-500/20 hover:border-gold-400 rounded-2xl py-16 px-6 transition-colors"
            >
              <span className="font-display text-3xl text-cream group-hover:text-gold-300 transition-colors">
                {c}
              </span>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  </section>

  {/* AVALIAÇÕES */ }
  {
    reviews.length > 0 && (
      <section className="bg-cream py-24">
        <div className="max-w-5xl mx-auto px-6">
          <RevealOnScroll className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-gold-600 text-xs mb-3">Clientes JW</p>
            <h2 className="font-display text-3xl md:text-4xl text-forest-950">
              Quem já viveu essa experiência
            </h2>
          </RevealOnScroll>

          <RevealOnScroll>
            <div className="bg-gold-300 border border-forest-900/10 rounded-lg p-6">
              {/* Mobile: carrossel horizontal */}
              <Carousel itemClassName="w-[280px] sm:w-[320px]">
                {reviews.slice(0, 6).map((r) => (
                  <ReviewCard key={r._id} review={r} />
                ))}
              </Carousel>

              {/* Desktop: grid fixo 2 linhas x 3 colunas (máx. 6 avaliações) */}
              <div className="hidden md:grid md:grid-cols-3 md:gap-6">
                {reviews.slice(0, 6).map((r) => (
                  <ReviewCard key={r._id} review={r} />
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    )
  }

{/* LOJA FÍSICA */}
<section className="bg-cream py-20 border-t border-forest-900/10">
  <RevealOnScroll className="max-w-3xl mx-auto px-6">
    <div className="text-center mb-10">
      <p className="uppercase tracking-[0.3em] text-gold-600 text-xs mb-3">
        Visite a loja
      </p>

      <h2 className="font-display text-3xl text-forest-950">
        Agora também com endereço físico
      </h2>
    </div>

    <div className="grid sm:grid-cols-2 gap-6">
      {/* LOCAL */}
      <div className="bg-forest-950/[0.03] border border-forest-900/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin size={19} className="text-gold-600 shrink-0" />

          <p className="uppercase tracking-[0.2em] text-gold-700 text-xs font-medium">
            Local
          </p>
        </div>

        <div className="pl-8">
          <p className="font-display text-lg text-forest-950 mb-1">
            Jardim Botânico
          </p>

          <p className="text-ink/70 text-sm leading-relaxed">
            Rua Visconde de Carandaí, 28
            <br />
            Rio de Janeiro, RJ
          </p>
        </div>
      </div>

      {/* HORÁRIO */}
      <div className="bg-forest-950/[0.03] border border-forest-900/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={19} className="text-gold-600 shrink-0" />

          <p className="uppercase tracking-[0.2em] text-gold-700 text-xs font-medium">
            Horário
          </p>
        </div>

        <div className="pl-8 space-y-2">
          <div>
            <p className="text-sm text-forest-950 font-medium">
              Quarta a sexta
            </p>
            <p className="text-sm text-ink/70">
              13h às 19h
            </p>
          </div>

          <div>
            <p className="text-sm text-forest-950 font-medium">
              Sábado
            </p>
            <p className="text-sm text-ink/70">
              13h às 17h
            </p>
          </div>
        </div>
      </div>
    </div>
  </RevealOnScroll>
</section>

  {/* CONTATO */ }
  <section id="contato" className="bg-forest-900 py-20">
    <RevealOnScroll className="max-w-2xl mx-auto px-6 text-center">
      <h2 className="font-display text-3xl text-cream mb-4">Vamos criar sua peça exclusiva?</h2>
      <p className="text-cream/70 mb-3 font-body">
        Fale direto com a Janayna pelo WhatsApp e conte qual momento você quer eternizar em joia,
        ou nos visite pessoalmente em nosso espaço no Jardim Botânico.
      </p>
      <p className="text-cream/40 text-xs mb-8">
        6x sem juros no cartão de crédito · 5% de desconto no Pix · Consultar forma de entrega.
      </p>
      <a
        href={WHATSAPP_LINK}
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