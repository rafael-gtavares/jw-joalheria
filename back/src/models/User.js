import mongoose from "mongoose";

// Perfil de usuário comum da aplicação.
// A autenticação (senha, provedor, etc.) é 100% no Firebase.

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    provider: { type: String, default: "password" }, // "password" | "google.com"
    role: { type: String, enum: ["user", "admin"], default: "user" },
    cart: {
      type: [
        {
          productId: { type: String, required: true },
          name: { type: String, default: "" },
          price: { type: Number, default: 0 },
          image: { type: String, default: "" },
          quantity: { type: Number, default: 1 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);