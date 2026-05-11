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

    // Save segments with a default 15s intro buffer
    const introBuffer = 15;
    if (lyrics && Array.isArray(lyrics)) {
      const segments = lyrics.map((text, index) => ({
        songId: song._id,
        segmentOrder: index + 1,
        text,
        startTime: introBuffer + (index * 3.5), // Estimate 3.5s per line + intro
        endTime: introBuffer + ((index + 1) * 3.5)
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

    // Use a more reliable public Google Translate endpoint
    const translateText = async (text: string, target: string) => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURI(text)}`;
        const res = await axios.get(url);
        // Google Translate returns an array structure: [[["translated", "original", ...]]]
        return res.data[0][0][0];
      } catch (err) {
        console.error(`Translation error for ${target}:`, err);
        return `[Error translating to ${target}]`;
      }
    };

    console.log(`Starting translation for song ${songId}...`);

    for (let seg of segments) {
      const hiText = await translateText(seg.text, "hi");
      const esText = await translateText(seg.text, "es");

      hindi.push({ order: seg.segmentOrder, text: hiText });
      spanish.push({ order: seg.segmentOrder, text: esText });
    }

    // Save translations to the Song document
    await Song.findByIdAndUpdate(songId, {
      translations: {
        hindi,
        spanish
      }
    });

    console.log(`Translation complete for song ${songId}`);
    res.json({ hindi, spanish });
  } catch (error: any) {
    console.error("AutoTranslate Overall Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getSegments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { songId } = req.params;
    const segments = await LyricSegment.find({ songId }).sort({ segmentOrder: 1 });
    res.json(segments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
