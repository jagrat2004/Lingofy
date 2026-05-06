import express from "express";
import { addSong, getSongs } from "../controllers/music/songController";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/roleMiddleware";

const router = express.Router();

router.post("/", protect, adminOnly, addSong);
router.get("/", getSongs);

export default router;
