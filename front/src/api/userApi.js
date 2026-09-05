import api from "./axios";

export const userApi = {
  // Cria/atualiza o documento de perfil do usuário logado no backend.
  // Chamado após signup e após login com Google.
  sync: (data) => api.post("/auth/sync", data).then((res) => res.data),
  me: () => api.get("/auth/me").then((res) => res.data),
  updateMe: (data) => api.put("/auth/me", data).then((res) => res.data),
};

export default userApi;