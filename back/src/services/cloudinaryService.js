import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadsDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

/**
 * Envia um buffer de imagem para o Cloudinary.
 * Caso o Cloudinary não esteja configurado (.env sem credenciais), faz um
 * fallback salvando localmente em backend/uploads — útil apenas para
 * desenvolvimento. Em produção, configure o Cloudinary.
 */
export function uploadImageBuffer(buffer, { folder = "jw-joalheria", filename } = {}) {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  }

  // Fallback local (apenas dev)
  const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(filename || "") || ".jpg"}`;
  const fullPath = path.join(localUploadsDir, safeName);
  fs.writeFileSync(fullPath, buffer);
  return Promise.resolve({ url: `/uploads/${safeName}`, publicId: "" });
}

export async function deleteImage(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
}
