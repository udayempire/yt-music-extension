import express from "express";
import type { NowPlayingUpdateRequest } from "../../../shared/types/now-playing.js";
import {
  getNowPlayingByChannelId,
  upsertNowPlaying
} from "../services/store.js";

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
  const current = getNowPlayingByChannelId(channelId);
  if (!current) {
    return res.status(404).json({ error: "No now playing data" });
  }
  return res.status(200).json(current);
});

export default router;