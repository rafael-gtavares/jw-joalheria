import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
