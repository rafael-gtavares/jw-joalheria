import api from "./axios";

export const orderApi = {
  // Cliente logado — cria o pedido e devolve { orderId, initPoint, ... }.
  // O servidor recalcula preços e frete; só envia { productId, quantity },
  // CEP, serviço de frete escolhido e a chave de idempotência.
  create: (payload) => api.post("/orders", payload).then((res) => res.data),

  // Cliente logado — pedidos da própria conta
  listMine: () => api.get("/orders/mine").then((res) => res.data),
  getMine: (id) => api.get(`/orders/mine/${id}`).then((res) => res.data),

  // Cliente (o seu pedido) ou admin (qualquer): consulta o pagamento no
  // Mercado Pago e atualiza o pedido, sem depender do webhook.
  syncPayment: (id) => api.post(`/payments/sync/${id}`).then((res) => res.data),

  // Admin
  // Filtros: origin (site|manual), from, to (AAAA-MM-DD), minAge, maxAge, gender, status, paymentStatus, q, page, limit
  // Resposta: { items, total, page, pages }
  listAdmin: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
    );
    return api.get("/orders", { params: clean }).then((res) => res.data);
  },
  getAdmin: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  // Registra o despacho (muda para "enviado") com o código de rastreio dos Correios.
  dispatch: (id, trackingCode, note) =>
    api.put(`/orders/${id}/dispatch`, { trackingCode, note }).then((res) => res.data),
  setTracking: (id, trackingCode) =>
    api.put(`/orders/${id}/tracking`, { trackingCode }).then((res) => res.data),
  refreshTracking: (id) => api.post(`/orders/${id}/tracking/refresh`).then((res) => res.data),
  createAdmin: (payload) => api.post("/orders/admin", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/orders/${id}`, payload).then((res) => res.data),
  updateStatus: (id, status, note) =>
    api.put(`/orders/${id}/status`, { status, note }).then((res) => res.data),
  remove: (id) => api.delete(`/orders/${id}`).then((res) => res.data),
};

export default orderApi;
