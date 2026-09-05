// Script utilitário: define a Custom Claim { role: "admin" } no usuário
// administrador já existente no Firebase (criado pelo Console).
//
// Como usar:
//   1) Descubra o UID do admin em Firebase Console > Authentication > Users
//      (ou rode este script passando o e-mail, veja abaixo).
//   2) Garanta que back/.env tenha FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL
//      e FIREBASE_PRIVATE_KEY preenchidos (mesmas credenciais já usadas pelo
//      firebase-admin do projeto).
//   3) Rode a partir da pasta back/:
//        node scripts/setAdminClaim.js --email=janayna@jwjoalheria.com
//      ou
//        node scripts/setAdminClaim.js --uid=UID_DO_ADMIN
//
// O usuário precisa deslogar e logar novamente (ou o token expirar e
// renovar) para que a claim passe a valer no frontend.

import dotenv from "dotenv";
import { initFirebaseAdmin } from "../src/config/firebase.js";

dotenv.config();

function parseArg(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : null;
}

async function main() {
  const admin = initFirebaseAdmin();
  if (!admin) {
    console.error("Firebase Admin não configurado. Preencha o .env antes de rodar.");
    process.exit(1);
  }

  const email = parseArg("email");
  const uidArg = parseArg("uid");

  if (!email && !uidArg) {
    console.error("Uso: node scripts/setAdminClaim.js --email=admin@exemplo.com");
    console.error("  ou: node scripts/setAdminClaim.js --uid=UID_DO_USUARIO");
    process.exit(1);
  }

  const userRecord = uidArg
    ? await admin.auth().getUser(uidArg)
    : await admin.auth().getUserByEmail(email);

  await admin.auth().setCustomUserClaims(userRecord.uid, { role: "admin" });

  console.log(`Claim role="admin" aplicada para uid=${userRecord.uid} (${userRecord.email}).`);
  console.log("Peça para essa pessoa sair e entrar novamente para renovar o token.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao aplicar a claim:", err.message);
  process.exit(1);
});