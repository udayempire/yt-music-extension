import type { NowPlayingUpdateRequest } from "../../shared/types/now-playing";
import type { ExtensionMessage } from "./types";

const API_BASE_URL = "http://localhost:4000";
const API_TOKEN = "Q7mN2xLp8Vt4Rk1Z";

async function postNowPlaying(body: NowPlayingUpdateRequest): Promise<void> {
  const res = await fetch(API_BASE_URL + "/api/now-playing/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_TOKEN
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("Update failed: " + res.status + " " + text);
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message?.type !== "NOW_PLAYING_UPDATE") return;

  void postNowPlaying({
    source: "ytmusic-extension",
    data: message.payload
  }).catch((err) => {
    console.error("[YT Music Now Playing] send failed", err);
  });
});