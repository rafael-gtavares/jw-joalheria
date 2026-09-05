import admin from "firebase-admin";

// Autenticação do painel administrativo via Firebase Authentication.
// O front-end faz login com Firebase e envia o ID Token; aqui validamos
// esse token com o Firebase Admin SDK.
//
// Configure as variáveis abaixo no .env (nunca commitar):
//   FIREBASE_PROJECT_ID=
//   FIREBASE_CLIENT_EMAIL=
//   FIREBASE_PRIVATE_KEY=   (mantenha as quebras de linha como \n)
//
// Essas credenciais vêm de: Firebase Console > Configurações do projeto >
// Contas de serviço > Gerar nova chave privada.

let initialized = false;

export function initFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "[firebase] Credenciais do Firebase Admin não configuradas. " +
        "O login administrativo não funcionará até que FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY sejam definidos no .env."
    );
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  initialized = true;
  return admin;
}

export default admin;
