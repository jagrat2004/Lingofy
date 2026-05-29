
import express, { Response } from "express";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import LessonAttempt from "../models/LessonAttempt";
import { generateLesson, generateSongLesson } from "../services/lessonService";
import Song from "../models/music/Song";
import LyricSegment from "../models/music/LyricSegment";
import { adminOnly } from "../middleware/roleMiddleware";

const router = express.Router();

// POST /api/lessons/generate
router.post("/generate", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { language, level } = req.body;

    if (!['hindi', 'spanish'].includes(language)) {
      return res.status(400).json({ message: "Invalid language" });
    }

    const activeLevel = ['easy', 'intermediate', 'hard'].includes(level) ? level : 'easy';

    // Fetch user's past attempts for this language+level to extract seen words & attempt count
    const pastAttempts = await LessonAttempt.find({
      userId: req.user._id,
      language,
      level: activeLevel
    }).sort({ completedAt: -1 }).limit(20).select('questions');

    // Extract all targetWords and correctAnswers the user has already seen
    const previousWords: string[] = [];
    for (const attempt of pastAttempts) {
      for (const q of attempt.questions as any[]) {
        if (q.targetWord) previousWords.push(q.targetWord);
        if (q.correctAnswer) previousWords.push(q.correctAnswer);
      }
    }
    // Deduplicate
    const uniquePreviousWords = [...new Set(previousWords)];

    // Count total quiz attempts at this level (for progressive difficulty)
    const totalAttempts = await LessonAttempt.countDocuments({
      userId: req.user._id,
      language,
      level: activeLevel
    });

    const lessonData = await generateLesson(language, activeLevel, uniquePreviousWords, totalAttempts);
    res.status(200).json(lessonData);
  } catch (error) {
    console.error("Error generating lesson:", error);
    res.status(500).json({ message: "Failed to generate lesson. Please try again.", error: (error as Error).message, stack: (error as Error).stack });
  }
});

// POST /api/lessons/generate-from-song
router.post("/generate-from-song", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { songId, language } = req.body;

    if (!songId) {
      return res.status(400).json({ message: "Song ID is required" });
    }

    if (!['hindi', 'spanish'].includes(language)) {
      return res.status(400).json({ message: "Invalid or missing language" });
    }

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const segments = await LyricSegment.find({ songId }).sort({ segmentOrder: 1 });
    
    // Map lyrics with translations
    const targetTranslations = language === 'hindi' ? song.translations?.hindi : song.translations?.spanish;
    const lyricsWithTranslations = segments.map(seg => {
      const translationObj = targetTranslations?.find((t: any) => t.order === seg.segmentOrder);
      return {
        english: seg.text,
        translation: translationObj ? translationObj.text : ""
      };
    }).filter(item => item.english);

    const lessonData = await generateSongLesson(language, song.title, song.artistName || '', lyricsWithTranslations);
    res.status(200).json(lessonData);
  } catch (error) {
    console.error("Error generating song lesson:", error);
    res.status(500).json({ message: "Failed to generate lesson from song. Please try again.", error: (error as Error).message });
  }
});

// POST /api/lessons/submit
router.post("/submit", protect, async (req: AuthRequest, res: Response) => {
  try {
    const { language, level, questions, userAnswers } = req.body;

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
    const activeLevel = ['easy', 'intermediate', 'hard'].includes(level) ? level : 'easy';

    const attempt = new LessonAttempt({
      userId: req.user._id,
      language,
      level: activeLevel,
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
      total: questions.length,
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

// GET /api/lessons/attempt/:attemptId
router.get("/attempt/:attemptId", protect, async (req: AuthRequest, res: Response) => {
  try {
    const attempt = await LessonAttempt.findOne({ _id: req.params.attemptId, userId: req.user._id });
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found" });
    }
    res.status(200).json(attempt);
  } catch (error) {
    console.error("Error fetching attempt details:", error);
    res.status(500).json({ message: "Failed to fetch attempt details." });
  }
});

// GET /api/lessons/progress - Get user's roadmap progress and badges
router.get("/progress", protect, async (req: AuthRequest, res: Response) => {
  try {
    const attempts = await LessonAttempt.find({ userId: req.user._id, score: { $gte: 5 } });

    const getProgressForLang = (lang: string) => {
      const langAttempts = attempts.filter(a => a.language === lang);

      const easyCount = langAttempts.filter(a => a.level === 'easy' || a.level === 'beginner').length;
      const intermediateCount = langAttempts.filter(a => a.level === 'intermediate').length;
      const hardCount = langAttempts.filter(a => a.level === 'hard').length;

      let currentStage = 'easy';
      const badges: string[] = [];

      if (easyCount >= 1) {
        badges.push('easy_explorer');
        currentStage = 'intermediate';
      }
      if (intermediateCount >= 1 && easyCount >= 1) {
        badges.push('intermediate_scholar');
        currentStage = 'hard';
      }
      if (hardCount >= 3 && intermediateCount >= 1 && easyCount >= 1) {
        badges.push('language_star');
        currentStage = 'completed';
      }

      return {
        easyCompleted: Math.min(easyCount, 1),
        intermediateCompleted: Math.min(intermediateCount, 1),
        hardCompleted: Math.min(hardCount, 3),
        currentStage,
        badges
      };
    };

    res.status(200).json({
      hindi: getProgressForLang('hindi'),
      spanish: getProgressForLang('spanish')
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/lessons/admin/progress/:userId - Get target user's progress (Admin only)
router.get("/admin/progress/:userId", protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const attempts = await LessonAttempt.find({ userId: req.params.userId, score: { $gte: 5 } });

    const getProgressForLang = (lang: string) => {
      const langAttempts = attempts.filter(a => a.language === lang);

      const easyCount = langAttempts.filter(a => a.level === 'easy' || a.level === 'beginner').length;
      const intermediateCount = langAttempts.filter(a => a.level === 'intermediate').length;
      const hardCount = langAttempts.filter(a => a.level === 'hard').length;

      let currentStage = 'easy';
      const badges: string[] = [];

      if (easyCount >= 1) {
        badges.push('easy_explorer');
        currentStage = 'intermediate';
      }
      if (intermediateCount >= 1 && easyCount >= 1) {
        badges.push('intermediate_scholar');
        currentStage = 'hard';
      }
      if (hardCount >= 3 && intermediateCount >= 1 && easyCount >= 1) {
        badges.push('language_star');
        currentStage = 'completed';
      }

      return {
        easyCompleted: Math.min(easyCount, 1),
        intermediateCompleted: Math.min(intermediateCount, 1),
        hardCompleted: Math.min(hardCount, 3),
        currentStage,
        badges
      };
    };

    res.status(200).json({
      hindi: getProgressForLang('hindi'),
      spanish: getProgressForLang('spanish')
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
