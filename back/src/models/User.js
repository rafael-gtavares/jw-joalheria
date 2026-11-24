import mongoose from "mongoose";

export const GENDERS = ["feminino", "masculino", "outro", "nao_informado"];

// Perfil de usuário comum da aplicação.
// A autenticação (senha, provedor, etc.) é 100% no Firebase.

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    provider: { type: String, default: "password" }, // "password" | "google.com"
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Dados opcionais informados pelo próprio cliente (cadastro ou perfil),
    // usados apenas para estatísticas/filtros do admin.
    birthDate: { type: Date, default: undefined, index: true },
    gender: {
      type: String,
      enum: GENDERS,
      default: "nao_informado",
    },
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