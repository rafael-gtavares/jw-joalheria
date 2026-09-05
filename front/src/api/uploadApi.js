import api from "./axios";

function buildFormData(files, folder) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  if (folder) formData.append("folder", folder);
  return formData;
}

export const uploadApi = {
  images: (files, folder = "products") =>
    api
      .post("/upload", buildFormData(files, folder), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data),
};

export default uploadApi;
