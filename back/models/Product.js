import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Anéis", "Brincos", "Colares", "Pulseiras", "Broches"],
      required: true,
    },
    material: { type: String, default: "Prata 925" },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    images: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
