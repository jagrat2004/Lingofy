import express from "express";
import { addSong, getSongs, autoTranslate, getSegments } from "../controllers/music/songController";
import { protect } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/roleMiddleware";
import User from "../models/user/User";
import LessonAttempt from "../models/LessonAttempt";

const router = express.Router();

router.post("/song", protect, adminOnly, addSong);
router.get("/", getSongs);
router.post("/translate/:songId", protect, adminOnly, autoTranslate);
router.get("/segments/:songId", getSegments);

// GET /api/admin/users - Get list of users (Admin only)
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users/:userId/attempts - Get history of attempts for a user (Admin only)
router.get("/users/:userId/attempts", protect, adminOnly, async (req, res) => {
  try {
    const attempts = await LessonAttempt.find({ userId: req.params.userId }).sort({ completedAt: -1 });
    res.status(200).json(attempts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/attempts/:attemptId - Get details of a single attempt (Admin only)
router.get("/attempts/:attemptId", protect, adminOnly, async (req, res) => {
  try {
    const attempt = await LessonAttempt.findById(req.params.attemptId).populate('userId', 'name email');
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.status(200).json(attempt);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
