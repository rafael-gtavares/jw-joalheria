// Rate limit em memória, por IP, sem dependências externas. Suficiente para
// proteger rotas públicas que disparam chamadas externas (ex.: cotação de
// frete). Se a API rodar em várias instâncias, troque por um limitador
// compartilhado (ex.: Redis).
export function rateLimit({ windowMs = 60_000, max = 20 } = {}) {
  const hits = new Map();

  // Limpeza periódica para o Map não crescer indefinidamente.
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res
        .status(429)
        .json({ error: "Muitas requisições. Aguarde um instante e tente novamente." });
    }
    next();
  };
}
