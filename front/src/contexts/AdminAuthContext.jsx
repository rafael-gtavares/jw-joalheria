// Mantido apenas por compatibilidade com código existente que ainda importa
// `useAdminAuth`/`AdminAuthProvider` (AdminLogin.jsx, AdminDashboard.jsx,
// RequireAdmin.jsx). Toda a lógica real agora mora em AuthContext.jsx, que é
// compartilhada por usuários comuns e administradores — ambos autenticam
// pelo mesmo Firebase Authentication.
export { AuthProvider as AdminAuthProvider, useAuth as useAdminAuth } from "./AuthContext";