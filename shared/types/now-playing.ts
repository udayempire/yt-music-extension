export type NowPlayingState = {
  channelId: string;
  title: string;
  artists: string;
  coverUrl: string | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  playedAt: number;
};

export type NowPlayingUpdateRequest = {
  source: "ytmusic-extension";
  data: NowPlayingState;
};