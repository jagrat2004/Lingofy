import { Request, Response } from "express";
import Song from "../../models/music/Song";
import LyricSegment from "../../models/music/LyricSegment";

export const addSong = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, artistName, language, lyrics } = req.body;

    // In this simplified admin flow, we store artistName directly 
    // or handle artist creation. For now, let's keep it simple.
    const song = await Song.create({
      title,
      artistName, // I'll need to add this to the model
      language,
      // Default values for other required fields if any
      audioUrl: "pending",
      durationSeconds: 0,
      albumId: new (require('mongoose').Types.ObjectId)(), // Placeholder
      artistId: new (require('mongoose').Types.ObjectId)(), // Placeholder
    });

    // Save segments
    if (lyrics && Array.isArray(lyrics)) {
      const segments = lyrics.map((text, index) => ({
        songId: song._id,
        segmentOrder: index + 1,
        text,
        startTime: 0,
        endTime: 0
      }));
      await LyricSegment.insertMany(segments);
    }

    res.status(201).json({ message: "Song added successfully", song });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSongs = async (req: Request, res: Response): Promise<void> => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
