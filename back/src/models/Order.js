import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    name: String,

    price: { type: Number, min: 0 },

    quantity: {
      type: Number,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "A quantidade deve ser um número inteiro.",
      },
    },
  },
  { _id: false }
);

// Situação da entrega segundo os Correios (independente do status interno do
// pedido e do status do pagamento).
export const DELIVERY_STATUSES = [
  "aguardando_postagem",
  "postado",
  "em_transito",
  "saiu_para_entrega",
  "entregue",
  "tentativa_sem_sucesso",
  "devolvido",
  "desconhecido",
];

export const STATUS_SOURCES = ["admin", "pagamento", "sistema", "correios"];

// Histórico imutável: cada mudança de status acrescenta uma entrada.
const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    paymentStatus: String,
    at: { type: Date, default: Date.now },
    source: { type: String, enum: STATUS_SOURCES, default: "sistema" },
    actorUid: String,
    actorEmail: String,
    note: { type: String, default: "" },
  },
  { _id: false }
);

const trackingEventSchema = new mongoose.Schema(
  {
    at: Date,
    description: String,
    location: String,
    code: String,
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    code: String,
    carrier: { type: String, default: "correios" },
    dispatchedAt: Date,
    deliveryStatus: {
      type: String,
      enum: DELIVERY_STATUSES,
      default: "aguardando_postagem",
    },
    events: { type: [trackingEventSchema], default: [] },
    lastEventAt: Date,
    // Controle de consultas aos Correios (evita chamadas desnecessárias).
    lastCheckedAt: Date,
    nextCheckAt: Date,
    lastError: String,
    // Dados fictícios de teste: nunca consultam a API dos Correios.
    simulated: { type: Boolean, default: false },
  },
  { _id: false }
);

// Opção de frete escolhida pelo cliente, recotada no servidor na criação do
// pedido. Pedidos antigos não têm este bloco (apenas shippingCep/shippingCost).
const shippingSchema = new mongoose.Schema(
  {
    cep: String,
    serviceCode: String,
    serviceName: String,
    price: { type: Number, min: 0 },
    productionDays: Number,
    shippingDays: Number,
    estimatedDeliveryDate: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // uid do Firebase de quem fez o pedido (vazio em pedidos criados pelo admin
    // ou anteriores ao checkout autenticado).
    user: {
      type: String,
      default: null,
      index: true,
    },

    // Chave enviada pelo front ao abrir o checkout; impede pedidos duplicados
    // quando a requisição é repetida (duplo clique, retry de rede).
    idempotencyKey: {
      type: String,
      default: undefined,
    },

    customerName: {
      type: String,
      required: true,
    },

    customerPhone: {
      type: String,
      default: "",
    },

    customerEmail: {
      type: String,
      default: "",
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingCep: {
      type: String,
      default: "",
    },

    shippingCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    shipping: {
      type: shippingSchema,
      default: undefined,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      default: "Mercado Pago",
    },

    // Estado do pedido
    status: {
      type: String,
      enum: [
        "pendente",
        "confirmado",
        "em produção",
        "pronto para envio",
        "enviado",
        "entregue",
        "cancelado",
      ],
      default: "pendente",
    },

    // Estado do pagamento no Mercado Pago
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "authorized",
        "in_process",
        "in_mediation",
        "rejected",
        "cancelled",
        "refunded",
        "charged_back",
      ],
      default: "pending",
    },

    // ID da preferência criada no Mercado Pago
    preferenceId: {
      type: String,
      default: null,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    tracking: {
      type: trackingSchema,
      default: undefined,
    },

    // Link do Checkout Pro, guardado para devolver o mesmo link quando o
    // pedido é repetido com a mesma idempotencyKey.
    checkoutUrl: {
      type: String,
      default: undefined,
    },

    // ID do pagamento realizado (índice único parcial abaixo: um pagamento
    // não pode estar ligado a dois pedidos).
    paymentId: {
      type: String,
      default: undefined,
    },

    paidAt: {
      type: Date,
      default: undefined,
    },

    // Pedido não pago expira (padrão 24h) e devolve o estoque reservado.
    expiresAt: {
      type: Date,
      default: undefined,
    },

    // Reserva de estoque feita na criação do pedido e devolvida no máximo uma vez.
    stockReserved: {
      type: Boolean,
      default: false,
    },
    stockReleased: {
      type: Boolean,
      default: false,
    },

    // Eventos de pagamento já aplicados ("<paymentId>:<status>"), para o
    // webhook ser idempotente.
    processedPaymentEvents: {
      type: [String],
      default: [],
      select: false,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } }
);

orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);

// Usado pela varredura de expiração.
orderSchema.index({ status: 1, expiresAt: 1 });

// Filtros por período e histórico do cliente.
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

// Varredura de rastreio: pedidos enviados com consulta vencida.
orderSchema.index({ status: 1, "tracking.nextCheckAt": 1 });

export default mongoose.model("Order", orderSchema);