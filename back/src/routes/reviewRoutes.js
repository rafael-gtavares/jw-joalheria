import { Router } from "express";
import {
  listPublicReviews,
  listAllReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { requireAdmin } from "../middleware/authentication.js";

const router = Router();

router.get("/", listPublicReviews);
router.post("/", createReview);

router.get("/admin/all", requireAdmin, listAllReviews);
router.put("/:id", requireAdmin, updateReview);
router.delete("/:id", requireAdmin, deleteReview);

export default router;
