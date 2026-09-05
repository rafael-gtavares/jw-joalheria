import api from "./axios";

export const authApi = {
  me: () => api.get("/auth/me").then((res) => res.data),
};

export default authApi;
