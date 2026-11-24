import React from "react";
import { WHATSAPP_LINK } from "../helpers/whatsapp";

export default function Footer() {
  return (
    <footer className="bg-sand border-t border-line">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-10 md:items-stretch">
          <div>
            <img
              src="/jw-logo.png"
              alt="JW"
              className="h-14 w-auto mix-blend-multiply -ml-1"
            />
            <p className="font-display italic text-2xl text-ink mt-4">
              Joias autorais, feitas para durar.
            </p>
            <p className="text-sm text-stone mt-3 max-w-xs leading-relaxed">
              Prata 950 e ouro 18k, desenhadas e produzidas por Janayna Waite.
            </p>
          </div>
 
          <div className="md:p-8 md:flex md:flex-col md:items-center md:justify-center">
            <p className="label mb-5">Fale conosco</p>
            <ul className="space-y-3 text-sm text-ink/80">
              <li>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="link-line"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/janaynawaitejoias/"
                  target="_blank"
                  rel="noreferrer"
                  className="link-line"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div className="md:p-8 md:flex md:flex-col md:items-center md:justify-center">
            <p className="label mb-5">Atendimento presencial</p>
            <p className="text-sm text-ink/80 leading-relaxed">
              Rua Visconde de Carandaí, 28
              <br />
              Jardim Botânico, Rio de Janeiro
            </p>
            <ul className="mt-4 space-y-1 text-sm text-ink/80">
              <li>Quarta a sexta, 13h às 19h</li>
              <li>Sábado, 13h às 17h</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-line flex flex-col sm:flex-row justify-between gap-2 text-xs text-stone">
          <p>&copy; {new Date().getFullYear()} JW Joalheria Autoral. Todos os direitos reservados.</p>
          <p>Janayna Waite · Joias autorais</p>
        </div>
      </div>
    </footer>
  );
}
