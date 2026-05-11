import { Request, Response } from "express";
import axios from "axios";
import Song from "../../models/music/Song";
import LyricSegment from "../../models/music/LyricSegment";

export const addSong = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, artistName, language, audioUrl, lyrics } = req.body;

    const song = await Song.create({
      title,
      artistName,
      language,
      audioUrl,
      durationSeconds: 0, // Default for now
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

export const autoTranslate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { songId } = req.params;

    const segments = await LyricSegment.find({ songId }).sort({ segmentOrder: 1 });

    const hindi: any[] = [];
    const spanish: any[] = [];

    for (let seg of segments) {
      const text = seg.text;

      try {
        const hiRes = await axios.post("https://libretranslate.de/translate", {
          q: text,
          source: "en",
          target: "hi",
          format: "text"
        });
        hindi.push({
          order: seg.segmentOrder,
          text: hiRes.data.translatedText
        });
      } catch (e) {
        hindi.push({ order: seg.segmentOrder, text: "[Translation Failed]" });
      }

      try {
        const esRes = await axios.post("https://libretranslate.de/translate", {
          q: text,
          source: "en",
          target: "es",
          format: "text"
        });
        spanish.push({
          order: seg.segmentOrder,
          text: esRes.data.translatedText
        });
      } catch (e) {
        spanish.push({ order: seg.segmentOrder, text: "[Translation Failed]" });
      }
    }

    res.json({ hindi, spanish });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
