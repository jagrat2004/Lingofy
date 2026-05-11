import express from "express";
import { addSong, getSongs, autoTranslate } from "../controllers/music/songController";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/song", protect, adminOnly, addSong);
router.get("/", getSongs);
router.post("/translate/:songId", protect, adminOnly, autoTranslate);

export default router;
