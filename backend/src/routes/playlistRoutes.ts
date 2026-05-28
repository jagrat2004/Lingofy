import express from "express";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import Playlist from "../models/playlist/Playlist";
import PlaylistSong from "../models/playlist/PlaylistSong";
import Song from "../models/music/Song";

const router = express.Router();

// GET /api/playlists - Get all playlists for the logged-in user
router.get("/", protect, async (req: AuthRequest, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(playlists);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/playlists - Create a new playlist
router.post("/", protect, async (req: AuthRequest, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Playlist title is required" });
    }

    const playlist = await Playlist.create({
      userId: req.user._id,
      title: title.trim()
    });

    res.status(201).json(playlist);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/playlists/:playlistId - Get details of a playlist and its songs
router.get("/:playlistId", protect, async (req: AuthRequest, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.playlistId, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const playlistSongs = await PlaylistSong.find({ playlistId: playlist._id }).populate("songId");
    // Extract populated song objects
    const songs = playlistSongs.map(ps => ps.songId).filter(s => s !== null);

    res.status(200).json({ playlist, songs });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/playlists/:playlistId/songs - Add a song to a playlist
router.post("/:playlistId/songs", protect, async (req: AuthRequest, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.playlistId, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const { songId } = req.body;
    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    // Verify if song exists
    const songExists = await Song.findById(songId);
    if (!songExists) {
      return res.status(404).json({ message: "Song not found" });
    }

    // Check if song is already in the playlist
    const alreadyInPlaylist = await PlaylistSong.findOne({
      playlistId: playlist._id,
      songId
    });

    if (alreadyInPlaylist) {
      return res.status(400).json({ message: "Song is already in this playlist" });
    }

    const playlistSong = await PlaylistSong.create({
      playlistId: playlist._id,
      songId
    });

    res.status(201).json(playlistSong);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/playlists/:playlistId/songs/:songId - Remove a song from a playlist
router.delete("/:playlistId/songs/:songId", protect, async (req: AuthRequest, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.playlistId, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    const deleted = await PlaylistSong.findOneAndDelete({
      playlistId: playlist._id,
      songId: req.params.songId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Song not found in this playlist" });
    }

    res.status(200).json({ message: "Song removed from playlist successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/playlists/:playlistId - Delete a playlist and its associations
router.delete("/:playlistId", protect, async (req: AuthRequest, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.playlistId, userId: req.user._id });
    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Also delete all PlaylistSong entries associated with this playlist
    await PlaylistSong.deleteMany({ playlistId: req.params.playlistId });

    res.status(200).json({ message: "Playlist deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
