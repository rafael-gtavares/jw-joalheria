const BASE_URL = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("jw_admin_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro na requisição.");
  return data;
}

async function requestUpload(path, formData) {
  const token = localStorage.getItem("jw_admin_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro ao enviar imagens.");
  return data;
}

export const api = {
  // Público
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProduct: (slug) => request(`/products/${slug}`),
  getFeedback: () => request(`/feedback`),
  submitFeedback: (payload) =>
    request(`/feedback`, { method: "POST", body: JSON.stringify(payload) }),
  createOrder: (payload) =>
    request(`/orders`, { method: "POST", body: JSON.stringify(payload) }),

  // Admin
  login: (payload) => request(`/auth/login`, { method: "POST", body: JSON.stringify(payload) }),
  getAllProducts: () => request(`/products/admin/all`),
  createProduct: (payload) =>
    request(`/products`, { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return requestUpload(`/upload`, formData);
  },
  getOrders: () => request(`/orders`),
  createOrderAdmin: (payload) =>
    request(`/orders/admin`, { method: "POST", body: JSON.stringify(payload) }),
  updateOrder: (id, payload) =>
    request(`/orders/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),
  getAllFeedback: () => request(`/feedback/admin/all`),
  approveFeedback: (id, approved) =>
    request(`/feedback/${id}/approve`, { method: "PUT", body: JSON.stringify({ approved }) }),
  deleteFeedback: (id) => request(`/feedback/${id}`, { method: "DELETE" }),
};
