import { Router } from "express";
import {
  listPublicProducts,
  getProductBySlug,
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { requireAdmin } from "../middleware/authentication.js";

const router = Router();

router.get("/", listPublicProducts);
router.get("/admin/all", requireAdmin, listAllProducts);
router.get("/:slug", getProductBySlug);

router.post("/", requireAdmin, createProduct);
router.put("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
