export function getLastNowPlaying(): NowPlayingState | null {
  let latest: NowPlayingState | null = null;
  for (const state of nowPlayingByChannel.values()) {
    if (!latest || state.playedAt > latest.playedAt) {
      latest = state;
    }
  }
  return latest;
}
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

const nowPlayingByChannel = new Map<string, NowPlayingState>();

export function upsertNowPlaying(state: NowPlayingState): void {
  const previous = nowPlayingByChannel.get(state.channelId);
  const isSameTrack =
    !!previous &&
    previous.title === state.title &&
    previous.artists === state.artists;

  // Keep the last known song URL if the same track is still active but current DOM no longer exposes a link.
  const mergedState: NowPlayingState =
    isSameTrack && !state.songUrl && previous.songUrl
      ? { ...state, songUrl: previous.songUrl }
      : state;

  nowPlayingByChannel.set(state.channelId, mergedState);
}

export function getNowPlayingByChannelId(
	channelId: string
): NowPlayingState | null {
	return nowPlayingByChannel.get(channelId) ?? null;
}
