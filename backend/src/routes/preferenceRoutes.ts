import express from "express";
import { savePreferences, getPreferences } from "../controllers/user/preferenceController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/", protect, savePreferences);
router.get("/", protect, getPreferences);

export default router;
