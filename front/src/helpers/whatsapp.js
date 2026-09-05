const WHATSAPP_NUMBER = "5521999079400";

// NOTA: a finalização de pedido via WhatsApp (antigo `buildOrderWhatsappUrl`)
// foi removida do fluxo de checkout. O botão "Finalizar pelo WhatsApp" deu
// lugar a "Ir para pagamento" (ver CartDrawer.jsx), que exige o cálculo de
// frete via Correios antes de ser habilitado. O WhatsApp continua sendo
// usado apenas para contato/interesse em peças (fora do checkout).

export function buildProductInterestWhatsappUrl(product) {
  const text = encodeURIComponent(
    `Olá Janayna! Tenho interesse na peça "${product.name}" da JW Joalheria Autoral.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
