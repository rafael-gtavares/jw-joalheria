import api from "./axios";

export const announcementApi = {
  // Público
  listPublic: () => api.get("/announcements").then((res) => res.data),

  // Admin
  listAllAdmin: () => api.get("/announcements/admin/all").then((res) => res.data),
  create: (payload) => api.post("/announcements", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/announcements/${id}`, payload).then((res) => res.data),
  remove: (id) => api.delete(`/announcements/${id}`).then((res) => res.data),
};

export default announcementApi;
