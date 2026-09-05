import api from "./axios";

export const orderApi = {
  // Público — registro do combinado com a cliente (pagamento segue via WhatsApp)
  create: (payload) => api.post("/orders", payload).then((res) => res.data),

  // Admin
  listAdmin: () => api.get("/orders").then((res) => res.data),
  createAdmin: (payload) => api.post("/orders/admin", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/orders/${id}`, payload).then((res) => res.data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }).then((res) => res.data),
  remove: (id) => api.delete(`/orders/${id}`).then((res) => res.data),
};

export default orderApi;
