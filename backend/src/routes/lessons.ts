
import express, { Response } from "express";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import LessonAttempt from "../models/LessonAttempt";
import { generateLesson } from "../services/lessonService";

const router = express.Router();

// POST /api/lessons/generate
router.post("/generate", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { language, level } = req.body;

    if (!['hindi', 'spanish'].includes(language)) {
      return res.status(400).json({ message: "Invalid language" });
    }

    // Fetch past lessons to determine dynamic difficulty
    const pastLessonsCount = await LessonAttempt.countDocuments({
      userId: req.user._id,
      language: language
    });

    const lessonData = await generateLesson(language, pastLessonsCount);
    res.status(200).json(lessonData);
  } catch (error) {
    console.error("Error generating lesson:", error);
    res.status(500).json({ message: "Failed to generate lesson. Please try again.", error: (error as Error).message, stack: (error as Error).stack });
  }
});

// POST /api/lessons/submit
router.post("/submit", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { language, questions, userAnswers } = req.body;

    if (!language || !questions || !userAnswers) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let score = 0;
    const results = userAnswers.map((ua: any) => {
      const question = questions.find((q: any) => q.id === ua.questionId);
      if (!question) return { ...ua, isCorrect: false };

      const cleanUser = ua.answer.trim().toLowerCase();
      const cleanCorrect = question.correctAnswer.trim().toLowerCase();
      let isCorrect = cleanUser === cleanCorrect;

      if (!isCorrect && language === 'hindi' && question.type === 'translate_word') {
        const matches = [...question.explanation.matchAll(/'([^']+)'/g)].map((m: any) => m[1].toLowerCase().trim());
        if (matches.includes(cleanUser)) {
          isCorrect = true;
        }
      }
      if (isCorrect) score++;

      return {
        questionId: ua.questionId,
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      };
    });

    const xpEarned = score * 10;

    const attempt = new LessonAttempt({
      userId: req.user._id,
      language,
      level: 'dynamic',
      questions,
      userAnswers: results.map((r: any) => ({
        questionId: r.questionId,
        answer: userAnswers.find((ua: any) => ua.questionId === r.questionId)?.answer || '',
        isCorrect: r.isCorrect
      })),
      score,
      xpEarned
    });

    await attempt.save();

    res.status(200).json({
      score,
      total: 10,
      xpEarned,
      results
    });
  } catch (error) {
    console.error("Error submitting lesson:", error);
    res.status(500).json({ message: "Failed to submit lesson." });
  }
});

// GET /api/lessons/history
router.get("/history", protect, async (req: AuthRequest, res: Response) => {
  try {
    const history = await LessonAttempt.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .limit(20)
      .select('language level score xpEarned completedAt');

    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching lesson history:", error);
    res.status(500).json({ message: "Failed to fetch history." });
  }
});

export default router;
