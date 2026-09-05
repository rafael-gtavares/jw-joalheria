// O login em si acontece no frontend via Firebase Authentication.
// Este endpoint apenas confirma que o ID Token enviado é válido e pertence
// a um administrador autorizado (ver middleware/authentication.js).
export function me(req, res) {
  res.json({ admin: req.admin });
}
