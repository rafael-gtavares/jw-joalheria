// Traduz códigos de erro do Firebase Auth em mensagens amigáveis, para nunca
// expor mensagens técnicas ("Firebase: Error (auth/...)") na interface.
const MESSAGES = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta está desativada.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
  "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
  "auth/popup-closed-by-user": "Login cancelado.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  "auth/requires-recent-login": "Por segurança, entre novamente antes de alterar a senha.",
};

export function friendlyAuthError(err) {
  const code = err?.code || "";
  return MESSAGES[code] || "Não foi possível concluir. Tente novamente.";
}

export default friendlyAuthError;