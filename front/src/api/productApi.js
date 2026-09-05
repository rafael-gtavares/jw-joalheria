import api from "./axios";
import { uploadApi } from "./uploadApi";

export const productApi = {
  // Público
  list: (params = {}) => api.get("/products", { params }).then((res) => res.data),
  get: (slug) => api.get(`/products/${slug}`).then((res) => res.data),

  // Admin
  listAllAdmin: () => api.get("/products/admin/all").then((res) => res.data),
  create: (payload) => api.post("/products", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/products/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/products/${id}`).then((res) => res.data),
  uploadImages: uploadApi.images,
};

export default productApi;
