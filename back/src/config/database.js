import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI não definida no .env");
  }
  await mongoose.connect(uri);
  console.log("MongoDB conectado");
}

export default connectDatabase;
