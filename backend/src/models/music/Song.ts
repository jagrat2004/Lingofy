import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISong extends Document {
  albumId?: mongoose.Types.ObjectId;
  artistId?: mongoose.Types.ObjectId;
  artistName: string;
  title: string;
  language: string;
  durationSeconds: number;
  audioUrl: string;
  instrumentalUrl?: string;
  bpm?: number;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  translations?: {
    english?: { order: number; text: string }[];
    hindi?: { order: number; text: string }[];
    spanish?: { order: number; text: string }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const SongSchema: Schema<ISong> = new Schema(
  {
    albumId: {
      type: Schema.Types.ObjectId,
      ref: "Album",
      required: false
    },

    artistId: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
      required: false
    },

    artistName: {
      type: String,
      required: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    language: {
      type: String,
      required: true
    },

    durationSeconds: {
      type: Number,
      required: true
    },

    audioUrl: {
      type: String,
      required: true
    },

    instrumentalUrl: {
      type: String
    },

    bpm: {
      type: Number
    },

    difficultyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    translations: {
      english: [{
        order: { type: Number },
        text: { type: String }
      }],
      hindi: [{
        order: { type: Number },
        text: { type: String }
      }],
      spanish: [{
        order: { type: Number },
        text: { type: String }
      }]
    }
  },
  {
    timestamps: true
  }
);

const Song: Model<ISong> = mongoose.model<ISong>("Song", SongSchema);

export default Song;