import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Acesso não autorizado. Faça login." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito ao administrador." });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}
