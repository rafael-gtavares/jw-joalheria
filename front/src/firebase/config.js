import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Todas as chaves abaixo são PÚBLICAS por natureza (fazem parte do app
// cliente do Firebase) e vêm de variáveis de ambiente do Vite.
// Configure em frontend/.env:
//   VITE_FIREBASE_API_KEY=
//   VITE_FIREBASE_AUTH_DOMAIN=
//   VITE_FIREBASE_PROJECT_ID=
//   VITE_FIREBASE_APP_ID=
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
