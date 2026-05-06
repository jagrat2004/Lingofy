import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  languagesToLearn: string[];
  favoriteGenres: string[];
  favoriteArtists: string[];
  vocabularyLevel: "beginner" | "intermediate" | "advanced";
  grammarFocus: boolean;
  phraseLearning: boolean;
  sessionGoalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema: Schema<IUserPreferences> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    languagesToLearn: {
      type: [String],
      default: []
    },

    favoriteGenres: {
      type: [String],
      default: []
    },

    favoriteArtists: {
      type: [String],
      default: []
    },

    vocabularyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },

    grammarFocus: {
      type: Boolean,
      default: false
    },

    phraseLearning: {
      type: Boolean,
      default: true
    },

    sessionGoalMinutes: {
      type: Number,
      default: 15,
      min: 5,
      max: 180
    }
  },
  {
    timestamps: true
  }
);

const UserPreferences: Model<IUserPreferences> =
  mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema);

export default UserPreferences;