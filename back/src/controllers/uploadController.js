import { uploadImageBuffer } from "../services/cloudinaryService.js";

export async function uploadImages(req, res) {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    const results = await Promise.all(
      req.files.map((file) =>
        uploadImageBuffer(file.buffer, { folder: req.body.folder || "products", filename: file.originalname })
      )
    );

    res.status(201).json({ images: results });
  } catch (err) {
    res.status(500).json({ error: "Erro ao enviar imagens." });
  }
}
