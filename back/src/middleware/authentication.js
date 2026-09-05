import { initFirebaseAdmin } from "../config/firebase.js";

// Lista de e-mails autorizados a administrar o painel, mantida como rede de
// segurança durante a migração para Custom Claims (ver scripts/setAdminClaim.js).
// Definir em .env: ADMIN_EMAILS=janayna@jwjoalheria.com,outra@email.com
function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// A role é decidida por Custom Claim (decoded.role === "admin"), nunca por
// nada enviado pelo cliente no corpo/query da requisição. A allowlist de
// e-mail é só um fallback enquanto o admin atual ainda não tem a claim.
function resolveRole(decoded) {
  if (decoded.role === "admin") return "admin";
  const email = (decoded.email || "").toLowerCase();
  if (getAdminEmails().includes(email)) return "admin";
  return "user";
}

async function verify(req) {
  const token = extractToken(req);
  if (!token) return { error: 401, message: "Acesso não autorizado. Faça login." };

  const admin = initFirebaseAdmin();
  if (!admin) {
    return {
      error: 500,
      message: "Autenticação não configurada no servidor (Firebase Admin).",
    };
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const role = resolveRole(decoded);
    return {
      user: {
        uid: decoded.uid,
        email: decoded.email || "",
        name: decoded.name || "",
        provider: decoded.firebase?.sign_in_provider || "password",
        role,
      },
    };
  } catch (err) {
    return { error: 401, message: "Sessão inválida ou expirada." };
  }
}

// Exige qualquer usuário autenticado (admin ou comum).
export async function requireAuth(req, res, next) {
  const result = await verify(req);
  if (result.error) return res.status(result.error).json({ error: result.message });
  req.user = result.user;
  next();
}

// Exige role === "admin". Mantido com o mesmo nome/uso de antes para não
// quebrar as rotas administrativas existentes.
export async function requireAdmin(req, res, next) {
  const result = await verify(req);
  if (result.error) return res.status(result.error).json({ error: result.message });
  if (result.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito ao administrador." });
  }
  req.user = result.user;
  req.admin = result.user; // compatibilidade com o controller/rota existentes
  next();
}

// Não bloqueia se não houver login; só anexa req.user quando houver token
// válido. Útil futuramente para rotas públicas que variam por usuário.
export async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  const result = await verify(req);
  if (!result.error) req.user = result.user;
  next();
}

export default requireAdmin;