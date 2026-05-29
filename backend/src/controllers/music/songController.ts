import { Request, Response } from "express";
import axios from "axios";
import Song from "../../models/music/Song";
import LyricSegment from "../../models/music/LyricSegment";

import { YoutubeTranscript } from 'youtube-transcript';

export const addSong = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, artistName, language, audioUrl, lyrics, youtubeUrl } = req.body;

    const song = await Song.create({
      title,
      artistName,
      language,
      audioUrl,
      durationSeconds: 0, // Default for now
    });

    let segments: any[] = [];
    const introBuffer = 15;

    // First try to fetch from YouTube transcript if URL is provided
    if (youtubeUrl) {
      try {
        console.log(`Attempting to fetch transcript for: ${youtubeUrl}`);
        const transcript = await YoutubeTranscript.fetchTranscript(youtubeUrl);
        
        segments = transcript.map((item, index) => ({
          songId: song._id,
          segmentOrder: index + 1,
          text: item.text,
          startTime: item.offset / 1000, // offset is in ms, convert to seconds
          endTime: (item.offset + item.duration) / 1000 // duration is also in ms
        }));
        
        // Update song duration based on the last segment if we have one
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          await Song.findByIdAndUpdate(song._id, { durationSeconds: Math.ceil(lastSegment.endTime) });
        }
      } catch (err: any) {
        console.warn("Failed to fetch YouTube transcript:", err.message);
        // Fallback to manual lyrics if provided, else it will just have 0 segments
      }
    }

    // Fallback: If no segments were fetched from YouTube, but manual lyrics are provided
    if (segments.length === 0 && lyrics && Array.isArray(lyrics)) {
      segments = lyrics.map((text, index) => ({
        songId: song._id,
        segmentOrder: index + 1,
        text,
        startTime: introBuffer + (index * 3.5), // Estimate 3.5s per line + intro
        endTime: introBuffer + ((index + 1) * 3.5)
      }));
    }

    if (segments.length > 0) {
      await LyricSegment.insertMany(segments);
    }

    res.status(201).json({ message: "Song added successfully", song, fetchedSegments: segments.length, segments });
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

const getLanguageCode = (lang: string): string => {
  const mapping: { [key: string]: string } = {
    english: "en",
    korean: "ko",
    spanish: "es",
    french: "fr",
    hindi: "hi",
    japanese: "ja",
    german: "de",
    italian: "it"
  };
  return mapping[lang.toLowerCase()] || "auto";
};

export const autoTranslate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { songId } = req.params;
    const song = await Song.findById(songId);
    if (!song) {
      res.status(404).json({ message: "Song not found" });
      return;
    }

    const segments = await LyricSegment.find({ songId }).sort({ segmentOrder: 1 });

    const english: any[] = [];
    const hindi: any[] = [];
    const spanish: any[] = [];

    const sourceLangCode = getLanguageCode(song.language);

    // Use a more reliable public Google Translate endpoint
    const translateText = async (text: string, target: string) => {
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLangCode}&tl=${target}&dt=t&q=${encodeURI(text)}`;
        const res = await axios.get(url);
        // Google Translate returns an array structure: [[["translated", "original", ...]]]
        return res.data[0][0][0];
      } catch (err) {
        console.error(`Translation error for ${target}:`, err);
        return `[Error translating to ${target}]`;
      }
    };

    console.log(`Starting translation for song ${songId} (source language: ${song.language})...`);

    for (let seg of segments) {
      const enText = sourceLangCode === "en" ? seg.text : await translateText(seg.text, "en");
      const hiText = sourceLangCode === "hi" ? seg.text : await translateText(seg.text, "hi");
      const esText = sourceLangCode === "es" ? seg.text : await translateText(seg.text, "es");

      english.push({ order: seg.segmentOrder, text: enText });
      hindi.push({ order: seg.segmentOrder, text: hiText });
      spanish.push({ order: seg.segmentOrder, text: esText });
    }

    // Save translations to the Song document
    await Song.findByIdAndUpdate(songId, {
      translations: {
        english,
        hindi,
        spanish
      }
    });

    console.log(`Translation complete for song ${songId}`);
    res.json({ english, hindi, spanish });
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
