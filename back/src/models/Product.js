import mongoose from "mongoose";
import { CATEGORIES } from "../constants/categories.js";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    collectionName: { type: String, default: "" }, // ex.: "Origem", "Bauhaus" — opcional, não fixo
    material: { type: String, default: "Prata 950" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false }, // aparece na Home
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: "" }, // id no Cloudinary, para permitir exclusão futura
      },
    ],
    active: { type: Boolean, default: true },

    // Dados administrativos usados exclusivamente para o cálculo de frete
    // (Correios). Nunca são exibidos na loja pública — apenas no painel
    // administrativo e no backend, ao montar a cotação de frete.
    shipping: {
      weight: {
        type: Number,
        required: [true, "Informe o peso da peça em gramas."],
        min: [0.1, "O peso da peça deve ser maior que zero."],
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
