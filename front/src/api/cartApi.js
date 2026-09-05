import api from "./axios";

export const cartApi = {
  get: () => api.get("/cart").then((res) => res.data.items || []),
  update: (items) => api.put("/cart", { items }).then((res) => res.data.items || []),
};

export default cartApi;