import type { NowPlayingState } from "../../shared/types/now-playing";
import type { NowPlayingUpdateMessage } from "./types";

const CHANNEL_ID = "uday-portfolio";
const PUSH_INTERVAL_MS = 3000;

const SELECTORS = {
  title: "ytmusic-player-bar .title",
  byline: "ytmusic-player-bar .byline",
  coverImage: "ytmusic-player-bar img.image"
};

function textFrom(selector: string): string {
  const el = document.querySelector<HTMLElement>(selector);
  return el?.textContent?.trim() ?? "";
}

function numberSafe(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value ?? 0));
}

function getVideo(): HTMLVideoElement | null {
  return document.querySelector("video");
}

function readNowPlaying(): NowPlayingState | null {
  const title = textFrom(SELECTORS.title);
  const artists = textFrom(SELECTORS.byline);
  const coverUrl =
    document.querySelector<HTMLImageElement>(SELECTORS.coverImage)?.src ?? null;

  const video = getVideo();
  const isPlaying = !!video && !video.paused;
  const positionSec = numberSafe(video?.currentTime);
  const durationSec = numberSafe(video?.duration);

  if (!title) return null;

  return {
    channelId: CHANNEL_ID,
    title,
    artists,
    coverUrl,
    isPlaying,
    positionSec,
    durationSec,
    playedAt: Date.now()
  };
}

let lastSignature = "";
let isActive = true;
let intervalId: number | null = null;

function disableTracking(): void {
  if (!isActive) return;
  isActive = false;
  observer.disconnect();
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function isContextInvalidatedError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message.includes("Extension context invalidated");
}

function signatureFor(state: NowPlayingState): string {
  return JSON.stringify({
    title: state.title,
    artists: state.artists,
    coverUrl: state.coverUrl,
    isPlaying: state.isPlaying,
    positionSec: state.positionSec,
    durationSec: state.durationSec
  });
}

function pushIfChanged(): void {
  if (!isActive) return;

  const state = readNowPlaying();
  if (!state) return;

  const sig = signatureFor(state);
  if (sig === lastSignature) return;
  lastSignature = sig;

  const message: NowPlayingUpdateMessage = {
    type: "NOW_PLAYING_UPDATE",
    payload: state
  };

  try {
    chrome.runtime.sendMessage(message, () => {
      if (!isActive) return;

      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message ?? "";
        if (errorMessage.includes("Extension context invalidated")) {
          disableTracking();
        }
      }
    });
  } catch (err) {
    if (isContextInvalidatedError(err)) {
      disableTracking();
      return;
    }

    throw err;
  }
}

const observer = new MutationObserver(() => {
  pushIfChanged();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true
});

intervalId = window.setInterval(pushIfChanged, PUSH_INTERVAL_MS);
pushIfChanged();