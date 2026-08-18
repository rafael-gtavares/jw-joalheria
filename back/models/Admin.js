import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
  },
  { timestamps: true }
);

adminSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

adminSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

export default mongoose.model("Admin", adminSchema);
