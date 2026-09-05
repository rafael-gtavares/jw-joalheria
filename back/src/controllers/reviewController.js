import Review from "../models/Review.js";

export async function listPublicReviews(req, res) {
  const reviews = await Review.find({ featuredHome: true })
    .sort({ createdAt: -1 })
    .limit(6); // Home mostra no máx. 6 (grid 2x3 no desktop)
  res.json(reviews);
}

export async function listAllReviews(req, res) {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
}

export async function createReview(req, res) {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateReview(req, res) {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!review) return res.status(404).json({ error: "Avaliação não encontrada." });
    res.json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteReview(req, res) {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}