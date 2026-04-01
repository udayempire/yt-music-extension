import express from "express";
import {
  getNowPlayingByChannelId,
  upsertNowPlaying,
  getLastNowPlaying
} from "../services/store.js";

export type NowPlayingState = {
  channelId: string;
  title: string;
  artists: string;
  coverUrl: string | null;
  songUrl: string | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  playedAt: number;
};

export type NowPlayingUpdateRequest = {
  source: "ytmusic-extension";
  data: NowPlayingState;
};

const router = express.Router();

router.post("/update", (req: express.Request, res: express.Response) => {
  const body: NowPlayingUpdateRequest = req.body;

  if (!body || body.source !== "ytmusic-extension" || !body.data?.channelId) {
    return res.status(400).json({ error: "Invalid source" });
  }

  upsertNowPlaying(body.data);

  return res.status(200).json({ message: "Now playing update received" });
});


router.get("/:channelId", (req: express.Request, res: express.Response) => {
  const { channelId } = req.params;
  if (typeof channelId !== "string") {
    return res.status(400).json({ error: "Invalid channelId" });
  }
  let current = getNowPlayingByChannelId(channelId);
  if (!current) {
    // Fallback: return the most recent now playing from any channel
    current = getLastNowPlaying();
    if (!current) {
      return res.status(404).json({ error: "No now playing data" });
    }
    return res.status(200).json({ ...current, fallback: true });
  }
  return res.status(200).json(current);
});

export default router;