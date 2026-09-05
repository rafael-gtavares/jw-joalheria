import User from "../models/User.js";

export async function getCart(req, res) {
  const user = await User.findOne({ uid: req.user.uid });
  res.json({ items: user?.cart || [] });
}

export async function updateCart(req, res) {
  try {
    const { items } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role, // sempre vem do token, nunca do corpo da requisição
        cart: Array.isArray(items) ? items : [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ items: user.cart });
  } catch (err) {
    res.status(400).json({ error: "Não foi possível salvar o carrinho." });
  }
}