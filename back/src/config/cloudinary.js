import { v2 as cloudinary } from "cloudinary";

// Preparado para upload de imagens de produtos e avaliações.
// Configure no .env (nunca commitar):
//   CLOUDINARY_CLOUD_NAME=
//   CLOUDINARY_API_KEY=
//   CLOUDINARY_API_SECRET=

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    "[cloudinary] Credenciais não configuradas. Uploads usarão o " +
      "armazenamento local de fallback (backend/uploads) até que " +
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET " +
      "sejam definidos no .env."
  );
}

export default cloudinary;
