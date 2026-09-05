import api from "./axios";

export const reviewApi = {
  // Público
  listPublic: () => api.get("/reviews").then((res) => res.data),
  submit: (payload) => api.post("/reviews", payload).then((res) => res.data),

  // Admin
  listAllAdmin: () => api.get("/reviews/admin/all").then((res) => res.data),
  create: (payload) => api.post("/reviews", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/reviews/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/reviews/${id}`).then((res) => res.data),
};

export default reviewApi;
