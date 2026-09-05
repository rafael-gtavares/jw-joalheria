import User from "../models/User.js";

// Chamado pelo frontend logo após signup/login (email/senha ou Google) para
// garantir que exista um documento de perfil correspondente ao uid do Firebase.
// Idempotente: se já existir, apenas atualiza nome/email/provider.
export async function syncProfile(req, res) {
  try {
    const { uid, email, role } = req.user;
    const { name, provider } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      {
        uid,
        email,
        role, // vem do token (Custom Claim), nunca do corpo da requisição
        ...(name ? { name } : {}),
        ...(provider ? { provider } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: "Não foi possível sincronizar o perfil." });
  }
}

export async function me(req, res) {
  const profile = await User.findOne({ uid: req.user.uid });
  res.json({
    uid: req.user.uid,
    email: req.user.email,
    role: req.user.role,
    name: profile?.name || req.user.name || "",
  });
}

export async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role, // sempre vem do token, nunca do corpo da requisição
        ...(name !== undefined ? { name } : {}),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: "Não foi possível atualizar o perfil." });
  }
}