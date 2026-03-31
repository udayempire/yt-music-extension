import type { NowPlayingState } from "../../shared/types/now-playing";

export type NowPlayingUpdateMessage = {
  type: "NOW_PLAYING_UPDATE";
  payload: NowPlayingState;
};

export type ExtensionMessage = NowPlayingUpdateMessage;