// Rótulos e utilitários compartilhados pelas telas de pedidos (cliente e admin).
// São três situações independentes: pagamento (Mercado Pago), produção/despacho
// (status interno definido pela loja) e entrega (Correios).

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "";
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("pt-BR") : "";
}

export function shortOrderId(id) {
  return String(id || "").slice(-6).toUpperCase();
}

// Etapas internas, na ordem em que acontecem.
export const STATUS_FLOW = [
  "pendente",
  "confirmado",
  "em produção",
  "pronto para envio",
  "enviado",
  "entregue",
];

export const ALL_STATUSES = [...STATUS_FLOW, "cancelado"];

// Rótulo mostrado ao cliente para cada etapa do status interno.
export const STEP_LABELS = {
  pendente: "Pedido realizado",
  confirmado: "Pagamento confirmado",
  "em produção": "Em produção",
  "pronto para envio": "Pronto para envio",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const PAYMENT_LABELS = {
  pending: "Aguardando pagamento",
  approved: "Aprovado",
  authorized: "Autorizado",
  in_process: "Em análise",
  in_mediation: "Em disputa",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  charged_back: "Estornado",
};

export const DELIVERY_LABELS = {
  aguardando_postagem: "Aguardando postagem",
  postado: "Postado",
  em_transito: "Em trânsito",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  tentativa_sem_sucesso: "Tentativa de entrega sem sucesso",
  devolvido: "Devolvido ao remetente",
  desconhecido: "Situação desconhecida",
};

export const GENDER_OPTIONS = [
  { value: "nao_informado", label: "Prefiro não informar" },
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "outro", label: "Outro" },
];

export const GENDER_LABELS = Object.fromEntries(GENDER_OPTIONS.map((g) => [g.value, g.label]));

// Resumo único mostrado ao cliente combinando pagamento + etapa.
export function customerOrderLabel(order) {
  if (order.status === "pendente") {
    return order.paymentStatus === "pending" ? "Aguardando pagamento" : "Pagamento em análise";
  }
  if (order.status === "enviado" && order.tracking?.deliveryStatus) {
    return DELIVERY_LABELS[order.tracking.deliveryStatus] || "Enviado";
  }
  return STEP_LABELS[order.status] || order.status;
}

export function trackingUrl(code) {
  return `https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(code)}`;
}
