import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: number;
  type: 'multiple_choice' | 'fill_blank' | 'translate_word' | 'match_meaning';
  questionText: string;
  targetWord: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface IUserAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

export interface ILessonAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  language: 'hindi' | 'spanish';
  level: 'easy' | 'intermediate' | 'hard' | 'beginner' | 'dynamic';
  questions: IQuestion[];
  userAnswers: IUserAnswer[];
  score: number;
  xpEarned: number;
  completedAt: Date;
}

const QuestionSchema: Schema = new Schema({
  id: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['multiple_choice', 'fill_blank', 'translate_word', 'match_meaning'],
    required: true 
  },
  questionText: { type: String, required: true },
  targetWord: { type: String, default: '' },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true }
});

const UserAnswerSchema: Schema = new Schema({
  questionId: { type: Number, required: true },
  answer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
});

const LessonAttemptSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  language: { type: String, enum: ['hindi', 'spanish'], required: true },
  level: { type: String, enum: ['easy', 'beginner', 'intermediate', 'hard', 'dynamic'], required: true },
  questions: { type: [QuestionSchema], required: true },
  userAnswers: { type: [UserAnswerSchema], required: true },
  score: { type: Number, required: true, min: 0 },
  xpEarned: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ILessonAttempt>('LessonAttempt', LessonAttemptSchema);
