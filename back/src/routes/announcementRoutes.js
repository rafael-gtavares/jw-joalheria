import { Router } from "express";
import {
  listPublicAnnouncements,
  listAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { requireAdmin } from "../middleware/authentication.js";

const router = Router();

router.get("/", listPublicAnnouncements);

router.get("/admin/all", requireAdmin, listAllAnnouncements);
router.post("/", requireAdmin, createAnnouncement);
router.put("/:id", requireAdmin, updateAnnouncement);
router.delete("/:id", requireAdmin, deleteAnnouncement);

export default router;
