import { Response } from "express";
import { AuthRequest } from "../../middleware/authMiddleware";
import UserPreferences from "../../models/user/UserPreference";

export const savePreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { languagesToLearn, favoriteGenres, favoriteArtists, vocabularyLevel, sessionGoalMinutes } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Update if exists, or create new
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      {
        languagesToLearn,
        favoriteGenres,
        favoriteArtists,
        vocabularyLevel: vocabularyLevel || "beginner",
        sessionGoalMinutes: sessionGoalMinutes || 15
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Preferences saved successfully",
      data: preferences
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      res.status(404).json({ message: "Preferences not found" });
      return;
    }

    res.status(200).json(preferences);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
