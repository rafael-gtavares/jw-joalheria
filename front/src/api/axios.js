import axios from "axios";
import { auth } from "../firebase/config";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Anexa o token do Firebase automaticamente nas rotas administrativas
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normaliza o erro para sempre expor a mensagem vinda do backend em err.message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || "Erro na requisição.";
    return Promise.reject(new Error(message));
  }
);

export default api;
