import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

// Como o site não processa pagamento, o pedido é o registro do que foi
// combinado com a cliente pelo WhatsApp — a administradora cria/atualiza
// manualmente pelo painel.
const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCep: { type: String, default: "" },
    shippingCost: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: "A combinar" },
    status: {
      type: String,
      enum: ["pendente", "confirmado", "em produção", "enviado", "entregue", "cancelado"],
      default: "pendente",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
